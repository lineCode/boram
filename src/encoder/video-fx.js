/**
 * Video effects tab.
 * @module boram/encoder/video-fx
 */

import {basename} from "path";
import {remote} from "electron";
import React from "react";
import {useSheet} from "../jss";
import FFmpeg from "../ffmpeg";
import ShowHide from "../show-hide";
import {
  HelpPane,
  Prop, SmallInput,
  SmallSelect, MenuItem,
  InlineCheckbox, Sep,
  SmallButton, Icon,
} from "../theme";
import {showLang} from "../util";

const COMMON_SUB_EXTENSIONS = [
  "ass", "ssa", "srt", "webvtt", "vtt", "sub",
];

const HELP = {
  cropw: [
    "Crop width",
    `Crop area width.`,
  ], croph: [
    "Crop height",
    `Crop area height.`,
  ], cropx: [
    "Crop left",
    `Horizontal position in the input video. Centered by default.`,
  ], cropy: [
    "Crop top",
    `Vertical position in the input video. Centered by default.`,
  ], scalew: [
    "Output width",
    `Specifies width of the resulting video.
     If height is empty, it will be calculated automatically,
     keeping the aspect ratio.

     Make sure to specify both fields for anamorphic video.`,
  ], scaleh: [
    "Output height",
    `Specifies height of the resulting video.
     If width is empty, it will be calculated automatically,
     keeping the aspect ratio.

     Make sure to specify both fields for anamorphic video.`,
  ],
};

@useSheet({
  valueCheck: {
    lineHeight: "48px",
  },
})
export default class extends React.PureComponent {
  getSubText(track, i) {
    const lang = showLang(track);
    return `#${i} (${track.codec_name}${lang ? ", " + lang : ""})`;
  }
  handleInterlaceDetect = () => {
    const inpath = this.props.source.path;
    const {vtrackn} = this.props;
    const start = this.props.mstart;
    this.props.onEncoding(true);
    FFmpeg.hasInterlace({inpath, vtrackn, start}).then(interlaced => {
      this.props.makeChecker("deinterlace")(null, interlaced);
      this.props.onEncoding(false);
    }, () => {
      // TODO(Kagami): Indicate error somewhere?
      this.props.onEncoding(false);
    });
  };
  handleCropDetect = () => {
    const inpath = this.props.source.path;
    const {vtrackn} = this.props;
    const vtrack = this.props.vtracks[vtrackn];
    const start = this.props.mstart;
    this.props.onEncoding(true);
    FFmpeg.getCropArea({inpath, vtrackn, start}).then(({w, h, x, y}) => {
      if (vtrack.width === w && vtrack.height === h) {
        w = h = x = y = "";
      }
      this.refs.cropw.setValue(w);
      this.refs.croph.setValue(h);
      this.refs.cropx.setValue(x);
      this.refs.cropy.setValue(y);
      this.props.onUpdate();
      this.props.onEncoding(false);
    }, () => {
      this.props.onEncoding(false);
    });
  };
  handleCropClear = () => {
    this.refs.cropw.setValue("");
    this.refs.croph.setValue("");
    this.refs.cropx.setValue("");
    this.refs.cropy.setValue("");
    this.props.onUpdate();
  };
  handleSubLoad = () => {
    const selected = remote.dialog.showOpenDialog({
      filters: [
        {name: "Subtitles", extensions: COMMON_SUB_EXTENSIONS},
        {name: "All files", extensions: ["*"]},
      ],
    });
    if (!selected) return;
    this.props.onSubLoad(selected[0]);
  };
  render() {
    const {classes} = this.sheet;
    return (
      <HelpPane
        help={HELP}
        focused={this.props.focused}
        warnings={this.props.warnings}
        errors={this.props.errors}
      >
        <Prop name="video track">
          <SmallSelect
            value={this.props.vtrackn}
            onChange={this.props.makeSelecter("vtrackn")}
            disabled={this.props.encoding}
          >
          {this.props.vtracks.map((t, i) =>
            <MenuItem
              key={i}
              value={i}
              primaryText={`#${i} (${t.width}x${t.height})`}
            />
          )}
          </SmallSelect>
        </Prop>
        <Prop name="deinterlace" valueClassName={classes.valueCheck}>
          <InlineCheckbox
            title="Toggle deinterlacing filter"
            checked={this.props.deinterlace}
            disabled={this.props.encoding}
            onCheck={this.props.makeChecker("deinterlace")}
          />
          <SmallButton
            icon={<Icon name="eye" />}
            title="Auto-detect interlacing"
            disabled={this.props.encoding}
            onClick={this.handleInterlaceDetect}
          />
        </Prop>
        <Prop name="crop">
          <SmallInput
            ref="cropw"
            hintText="width"
            width={45}
            disabled={this.props.encoding}
            onFocus={this.props.makeFocuser("cropw")}
            onBlur={this.props.onUpdate}
          />
          <Sep size={10}>:</Sep>
          <SmallInput
            ref="croph"
            hintText="height"
            width={45}
            disabled={this.props.encoding}
            onFocus={this.props.makeFocuser("croph")}
            onBlur={this.props.onUpdate}
          />
          <Sep size={10}>:</Sep>
          <SmallInput
            ref="cropx"
            hintText="left"
            width={45}
            disabled={this.props.encoding}
            onFocus={this.props.makeFocuser("cropx")}
            onBlur={this.props.onUpdate}
          />
          <Sep size={10}>:</Sep>
          <SmallInput
            ref="cropy"
            hintText="top"
            width={45}
            disabled={this.props.encoding}
            onFocus={this.props.makeFocuser("cropy")}
            onBlur={this.props.onUpdate}
          />
          <Sep/>
          <SmallButton
            icon={<Icon name="eye" />}
            title="Auto-detect black borders"
            disabled={this.props.encoding}
            onClick={this.handleCropDetect}
          />
          <Sep margin={2.5} />
          <SmallButton
            icon={<Icon name="remove" />}
            title="Discard crop"
            disabled={this.props.encoding}
            onClick={this.handleCropClear}
          />
        </Prop>
        <Prop name="scale">
          <SmallInput
            ref="scalew"
            hintText="width"
            width={45}
            disabled={this.props.encoding}
            onFocus={this.props.makeFocuser("scalew")}
            onBlur={this.props.onUpdate}
          />
          <Sep size={10}>×</Sep>
          <SmallInput
            ref="scaleh"
            hintText="height"
            width={45}
            disabled={this.props.encoding}
            onFocus={this.props.makeFocuser("scaleh")}
            onBlur={this.props.onUpdate}
          />
          <Sep size={10} />
          <ShowHide show={this.props._anamorph}>
            <InlineCheckbox
              label="fix sar"
              title="Make output video non-anamorphic (recommended)"
              checked={this.props.fixSAR}
              disabled={this.props.encoding}
              onCheck={this.props.makeChecker("fixSAR")}
            />
          </ShowHide>
        </Prop>
        {/*<Prop name="speed">
          <SmallInput
            ref="speed"
            hintText="factor"
            onFocus={this.props.makeFocuser("speed")}
            onBlur={this.props.onUpdate}
          />
          <Sep margin={10} />
          <SmallInput
            ref="fps"
            hintText="fps"
            onFocus={this.props.makeFocuser("fps")}
            onBlur={this.props.onUpdate}
          />
        </Prop>*/}
        <Prop name="burn subs">
          <InlineCheckbox
            checked={this.props.burnSubs}
            disabled={this.props.encoding ||
                      (!this.props.stracks.length && !this.props.extSubPath)}
            onCheck={this.props.makeChecker("burnSubs")}
          />
          <SmallSelect
            hintText="no subs"
            value={this.props.strackn}
            disabled={this.props.encoding || !this.props.burnSubs}
            onChange={this.props.makeSelecter("strackn")}
          >
          {this.props.stracks.map((t, i) =>
            <MenuItem
              key={i}
              value={i}
              primaryText={this.getSubText(t, i)}
            />
          )}
          {this.props.extSubPath ?
            /* ShowHide doesn't work inside SelectField. */
            <MenuItem
              value={this.props.stracks.length}
              primaryText={basename(this.props.extSubPath)}
            />
          : null}
          </SmallSelect>
          <Sep/>
          <SmallButton
            icon={<Icon name="folder-open-o" />}
            title="Load external subtitle"
            disabled={this.props.encoding}
            onClick={this.handleSubLoad}
          />
        </Prop>
      </HelpPane>
    );
  }
}

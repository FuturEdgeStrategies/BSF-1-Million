import type {FC} from 'react';
import {Composition} from 'remotion';
import {LeadsSlippingAway, LEADS_FRAMES} from './scenes/LeadsSlippingAway';
import {CaptureReplyBook, CRB_FRAMES} from './scenes/CaptureReplyBook';
import {FuturEdgeBuildsIt, FEB_FRAMES} from './scenes/FuturEdgeBuildsIt';

const base = {fps: 30, width: 1080, height: 1920} as const;

export const RemotionRoot: FC = () => (
  <>
    <Composition id="leads-slipping-away" component={LeadsSlippingAway} durationInFrames={LEADS_FRAMES} {...base} />
    <Composition id="capture-reply-book" component={CaptureReplyBook} durationInFrames={CRB_FRAMES} {...base} />
    <Composition id="futuredge-builds-it" component={FuturEdgeBuildsIt} durationInFrames={FEB_FRAMES} {...base} />
  </>
);

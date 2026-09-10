import React from 'react';
import {registerRoot, Composition, Folder} from 'remotion';
import {board} from './storyboard.mjs';
import {Film, Shot} from './Scenes.jsx';
import {length, shotId, validateBoard} from './timing.mjs';
validateBoard(board);
const size = {fps: board.fps, width: board.width, height: board.height};
function Root() {
  return <>
    <Composition id="Film" component={Film} durationInFrames={board.targetSeconds * board.fps} {...size} defaultProps={{board}}/>
    <Folder name="Shots">{board.shots.flatMap((shot) => shot.variants.map((variant) =>
      <Composition key={shotId(shot, variant)} id={shotId(shot, variant)} component={Shot}
        durationInFrames={length(shot)} {...size} defaultProps={{shot, variant}}/>
    ))}</Folder>
  </>;
}
registerRoot(Root);

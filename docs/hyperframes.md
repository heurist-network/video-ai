# HyperFrames guide map

Use the focused [local runtime essentials](hyperframes-runtime.md) when writing or
diagnosing composition HTML, and load official skills for the domains needed below.
The local reference is trimmed; the official skills contain more detail.
The official skills live under `.agents/skills/`; `.claude/skills` links there for Claude Code.

| Task | Read |
| --- | --- |
| Start or resume HyperFrames work | [hyperframes entry skill](../.agents/skills/hyperframes/SKILL.md) |
| Write composition HTML, root sizing, timing, tracks or sub-compositions | [hyperframes-core](../.agents/skills/hyperframes-core/SKILL.md) |
| Design timeline motion, easing, staggers or rolling text | [hyperframes-animation](../.agents/skills/hyperframes-animation/SKILL.md) |
| Perspective, zooms, camera motion, masks or seek-safe transforms | [hyperframes-keyframes](../.agents/skills/hyperframes-keyframes/SKILL.md) |
| Find/install a named treatment, prefab or effect | [hyperframes-registry](../.agents/skills/hyperframes-registry/SKILL.md) |
| Lint, check, snapshot, preview or render | [hyperframes-cli](../.agents/skills/hyperframes-cli/SKILL.md) |
| Palette, typography and non-motion art direction | [hyperframes-creative](../.agents/skills/hyperframes-creative/SKILL.md) |
| Source media, fonts, logos, sound or footage | [media-use](../.agents/skills/media-use/SKILL.md) |
| Mix placed audio tracks | [hyperframes-audio](../.agents/skills/hyperframes-audio/SKILL.md) |

## How this fits the local workflow

The [local storyboard skill](../storyboard/SKILL.md) owns our HTML review board. When iterating, resume from the conversation and storyboard; do not create a second storyboard.

When reviewing, inspect the actual output image frames. Do not treat source-code inspection as having watched a video.

Useful starting commands:

```sh
npx hyperframes catalog --query "screen mesh display"
npx hyperframes add yt-screen-warp --no-clipboard
npx hyperframes check
npx hyperframes snapshot --at 0.5,1.5,3
npx hyperframes render --quality high --output export/video-v1.mp4
```

Official sources: [skills setup](https://hyperframes.heygen.com/guides/skills), [HyperFrames repository](https://github.com/heygen-com/hyperframes),
[documentation index](https://hyperframes.heygen.com/llms.txt) no need to read or download unless instructed

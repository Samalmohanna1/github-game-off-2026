import Phaser from 'phaser';
import { COLORS, FIGURE_FLOOR_Y, GAME_WIDTH, TITLE } from '@/config';
import { TITLE_POSE } from '@/data/poses';
import { CENTER_LANE, laneCenterX } from '@/logic/lanes';
import { project } from '@/logic/perspective';
import { holeGrid } from '@/logic/wall-gen';
import { cardSlant, drawCard } from '@/objects/card';
import { ControlsBar } from '@/objects/ControlsBar';
import { Figure } from '@/objects/Figure';
import { Floor } from '@/objects/Floor';
import { GridVoid } from '@/objects/GridVoid';
import { PromptBadge } from '@/objects/PromptBadge';
import { Wall } from '@/objects/Wall';
import { SceneKeys } from '@/scenes/scene-keys';
import { textStyle } from '@/scenes/text-styles';

// The title (M11): the play stage itself, a wall coming down the runway with
// its hole in TITLE_POSE a little off to the side of the figure, under the
// logo, with the controls in the bar where the letters come up in play.
// Starting needs a click, not a key: inside the itch.io iframe the page has
// no keyboard focus until the player clicks into it (PLAN.md §2).
export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Title);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.void);
    new GridVoid(this);
    new Floor(this);
    const wall = new Wall(this);
    wall.setHole(CENTER_LANE + TITLE.holeLanes, holeGrid(TITLE_POSE));
    wall.setScale(TITLE.wallScale);
    const feet = project({ x: laneCenterX(CENTER_LANE), y: FIGURE_FLOOR_Y }, TITLE.figureScale);
    new Figure(this, CENTER_LANE).setScale(TITLE.figureScale).setPosition(feet.x, feet.y);

    const { y, height, padX, textNudge } = TITLE.logo;
    const card = this.add.graphics();
    const logo = this.add.text(GAME_WIDTH / 2, y + height / 2 + textNudge, 'SHAPE SHIFT', textStyle('title', 'ink')).setOrigin(0.5);
    const width = logo.width + 2 * padX + 2 * cardSlant(height);
    drawCard(card, { x: (GAME_WIDTH - width) / 2, y, width, height, slant: 'both' });

    new PromptBadge(this, GAME_WIDTH / 2, TITLE.promptY, 'CLICK TO PLAY');
    new ControlsBar(this, [
      { keys: ['SPACE'], caption: 'MOVE TO THE HOLE' },
      { keys: ['a', 's'], caption: 'HOLD THE LETTERS' },
      { keys: ['SHIFT'], caption: 'FOR CAPITALS' },
    ]);

    this.input.once('pointerdown', () => {
      window.focus();
      this.scene.start(SceneKeys.Play);
    });
  }
}

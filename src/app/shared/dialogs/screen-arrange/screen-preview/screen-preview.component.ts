import { Component, Input } from '@angular/core';
import { CombinedClip, Screen } from '@memebox/contracts';

@Component({
  selector: 'app-screen-preview',
  templateUrl: './screen-preview.component.html',
  styleUrls: ['./screen-preview.component.scss']
})
export class ScreenPreviewComponent {
  @Input()
  screen: Screen;

  @Input()
  allItems: CombinedClip[];
}

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  TrackByFunction
} from '@angular/core';
import { Clip, CombinedClip, PositionEnum, Screen } from '@memebox/contracts';
import { DragResizeMediaComponent } from '../drag-resize-media/drag-resize-media.component';
import { AppService } from '../../../../state/app.service';
import { FormBuilder, FormControl } from '@angular/forms';

enum GlobalArrangeOptions {
  Drag,
  Resize,
  Rotate,
  Warp
}

@Component({
  selector: 'app-screen-arrange-preview',
  templateUrl: './screen-arrange-preview.component.html',
  styleUrls: ['./screen-arrange-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScreenArrangePreviewComponent {
  @Input()
  currentSelectedClip: CombinedClip | null = null;

  @Input()
  visibleItems: CombinedClip[];

  @Input()
  screen: Screen;

  @Output()
  changeCurrSelectedClip = new EventEmitter<CombinedClip | null>();

  @Output()
  userChangeElement = new EventEmitter<string>();

  // Outputs the ids of the saved medias
  @Output()
  changesSaved = new EventEmitter<string | string[]>();

  trackByClip: TrackByFunction<Clip> = (index, item) => item.id;

  get isDragEnabled(): boolean {
    return !this.currentSelectedClip?.clipSetting?.arrangeLock?.position &&
      this.globalActionsForm.value.includes(GlobalArrangeOptions.Drag);
  }

  get isResizeEnabled(): boolean {
    return !this.currentSelectedClip?.clipSetting?.arrangeLock?.size &&
      this.globalActionsForm.value.includes(GlobalArrangeOptions.Resize);
  }

  get isRotateEnabled(): boolean {
    return !this.currentSelectedClip?.clipSetting?.arrangeLock?.transform &&
      this.globalActionsForm.value.includes(GlobalArrangeOptions.Rotate);
  }

  get isWarpEnabled(): boolean {
    return !this.currentSelectedClip?.clipSetting?.arrangeLock?.transform &&
      this.globalActionsForm.value.includes(GlobalArrangeOptions.Warp);
  }

  readonly GlobalArrangeOptions = GlobalArrangeOptions;
  readonly PositionEnum = PositionEnum;

  globalActionsForm = new FormControl([
    GlobalArrangeOptions.Drag,
    GlobalArrangeOptions.Resize,
    GlobalArrangeOptions.Rotate
  ] as GlobalArrangeOptions[]);

  sizeSelection: 'px' | '%' = 'px';

  private combinedClipToComponent = new WeakMap<CombinedClip, DragResizeMediaComponent>();

  private previouslyClickedComponent: DragResizeMediaComponent | null = null;

  constructor(private _cd: ChangeDetectorRef,
              private _fb: FormBuilder,
              private appService: AppService) {
    this.globalActionsForm.valueChanges.subscribe(_ => console.warn('aa', _));
  }


  triggerChangedetection() {
    const component = this.combinedClipToComponent.get(this.currentSelectedClip);

    console.info('trigger cd', {
      component, clip: this.currentSelectedClip
    });

    if (component) {
      component.settings = this.currentSelectedClip.clipSetting;
      component.ngOnChanges({});
    }

    this._cd.detectChanges();
  }

  userChangedElement() {
    this.userChangeElement.emit(this.currentSelectedClip.clip.id);
  }

  sizeOptionChanged(newValue: 'px' | '%') {
    // TODO: Set the option
    //this.currentSelectedClip.clipSetting = newValue;
    this.sizeSelection = newValue;
    this.triggerChangedetection();
  }

  positionOptionChanged(newPosition: PositionEnum) {
    if (this.currentSelectedClip == null) {
      return;
    }
    this.currentSelectedClip.clipSetting.position = newPosition;
    this.triggerChangedetection();
  }

  elementCreated(dragResizeMediaComponent: DragResizeMediaComponent, pair: CombinedClip) {
    this.combinedClipToComponent.set(pair, dragResizeMediaComponent);
  }

  clickedOutside() {
    this.changeCurrSelectedClip.emit(null);
    this.resetTheResizeBorder();

    console.info('clicked outside');

    this._cd.markForCheck();
  }

  applySingleChanges() {
    this.appService.addOrUpdateScreenClip(this.screen.id, this.currentSelectedClip.clipSetting);
    this.changesSaved.emit(this.currentSelectedClip.clip.id);
  }

  async applyAllchanges() {
    for (const item of this.visibleItems) {
      // TODO replace with a bulk update
      await this.appService.addOrUpdateScreenClip(this.screen.id, item.clipSetting);
    }

    this.changesSaved.emit(this.visibleItems.map(i => i.clip.id));
  }

  reset() {
    const { clipSetting } = this.currentSelectedClip;

    clipSetting.transform = null;
    clipSetting.width = '50%';
    clipSetting.height = '50%';

    if (clipSetting.position === PositionEnum.Absolute) {
      clipSetting.top = '10%';
      clipSetting.left = '10%';
      clipSetting.right = null;
      clipSetting.bottom = null;
    }

    if (clipSetting.position === PositionEnum.Centered) {
      clipSetting.top = null;
      clipSetting.left = null;
    }

    this.appService.addOrUpdateScreenClip(this.screen.id, clipSetting);
  }

  elementClicked(dragResizeMediaComponent: DragResizeMediaComponent,
                 pair: CombinedClip) {
    this.resetTheResizeBorder();

    this.changeCurrSelectedClip.emit(pair);

    // todo select the item in the left list
    this.previouslyClickedComponent = dragResizeMediaComponent;
    dragResizeMediaComponent.showResizeBorder = true;

    console.warn('show resize border true');

    this._cd.markForCheck();
  }

  private resetTheResizeBorder() {
    if (this.previouslyClickedComponent != null) {
      this.previouslyClickedComponent.showResizeBorder = false;
    }
  }
}

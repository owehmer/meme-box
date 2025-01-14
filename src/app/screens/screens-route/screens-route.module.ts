import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CommonModule} from "@angular/common";
import {ScreensRouteComponent} from "./screens-route.component";
import {TargetScreenModule} from "../target-screen/target-screen.module";
import {StateModule} from "../../state/state.module";

const routes: Routes = [
  {
    path: '',
    component: ScreensRouteComponent
  }
];


@NgModule({
  declarations: [
    ScreensRouteComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TargetScreenModule,

    StateModule
  ],
  exports: [RouterModule]
})
export class ScreensRouteModule {
}

/*
 * Angular 2 decorators and services
 */
import {Component, ViewEncapsulation} from 'angular2/core';
import {RouteConfig, Router} from 'angular2/router';

import {Home} from './home';
import {AppState} from './app.service';
import {RouterActive} from './router-active';
import {ArchitectureComponent} from "./architecture/architecture.component";

/*
 * App Component
 * Top Level Component
 */
@Component({
  selector: 'app',
  pipes: [],
  providers: [],
  directives: [RouterActive],
  encapsulation: ViewEncapsulation.None,
  styles: [require('./app.scss')],
  template: require('./app.html')
})
@RouteConfig([
  {path: '/Index', name: 'Index', component: Home, useAsDefault: true},
  {path: '/home', name: 'Home', component: Home},
  {path: '/Architecture/...', name: 'Architecture', component: ArchitectureComponent},
  // Async load a component using Webpack's require with es6-promise-loader and webpack `require`
  {path: '/about', name: 'About', loader: () => require('es6-promise!./about')('About')},
  {path: '/architecture', name:'Architecture', component: ArchitectureComponent},
])
export class App {
  angularclassLogo = 'assets/img/angularclass-avatar.png';
  name = 'Angular 2 Webpack Starter';
  url = 'https://twitter.com/AngularClass';

  constructor(public appState:AppState) {
  }

  ngOnInit() {
    console.log('Initial App State', this.appState.state);
  }

}

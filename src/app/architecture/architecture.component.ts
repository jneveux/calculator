import {Component} from 'angular2/core';
import {RouteConfig, Router} from 'angular2/router';
import {HomeComponent} from "./wizzard/home.component";
import {ArchitectureModel, ArchitectureService} from "./service/architecture.service";
import {TypeComponent} from "./wizzard/type.component";

class Question {
  hasNext: boolean = false;
  hasPrevious: boolean = false;
}

@Component({
  selector: 'architecture-selector',
  providers: [ArchitectureService],
  template: require('./architecture.html')
})
@RouteConfig([
  {path: '/Home', name: 'HomeArchitecture', component: HomeComponent, useAsDefault: true},
  {path: '/Type', name: 'TypeArchitecture', component: TypeComponent}
])
export class ArchitectureComponent {
  data: ArchitectureModel;
  questions: Question;
  constructor(public architectureService: ArchitectureService, private router:Router) {
    this.data = architectureService.init();
    this.questions = new Question();
    this.questions.hasNext = true;
  }

  public nextQuestion() : void {
    console.log('Next question');
    this.questions.hasPrevious = true;
    this.router.navigate(['TypeArchitecture']);
  }

  public  previousQuestion() : void {
    this.questions.hasPrevious = false;
    this.questions.hasNext = true;
    console.log('Previous question');
    this.router.navigate(['HomeArchitecture']);
  }
}

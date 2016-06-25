/**
 * Created by jean on 6/25/16.
 */
import {Directive, Input, ElementRef, SimpleChanges, OnChanges} from '@angular/core';


@Directive({
  selector: '[focused]',
  providers: []
})
export class FocusDirective implements OnChanges {
  changedValue:boolean;

  @Input('focused')
  focused:boolean;

  constructor(private el:ElementRef) {

  }

  /**
   * Detect changes in the directive.
   * @param change contains the change map.
   */
  ngOnChanges(change:SimpleChanges) {
    if (change['focused']) {
      if (change['focused'].currentValue) setTimeout(() => {
        this.el.nativeElement.focus();
      }, 0);
    }
  }
}

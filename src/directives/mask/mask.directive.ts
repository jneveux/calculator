/**
 * Created by jean on 6/25/16.
 */
import {
  Directive,
  ElementRef,
  Input,
  HostListener,
  forwardRef,
  Provider} from '@angular/core';
import {NgControl, DefaultValueAccessor, NgModel} from '@angular/common';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';

const MASK_VALUE_ACCESSOR: Provider = new Provider(NG_VALUE_ACCESSOR, {
  useExisting: forwardRef(() => MaskSelector),
  multi: true
});

class LinkOptions {
  maskDefinitions:any = {
    '9': /\d/,
    'A': /[a-zA-Z]/,
    '*': /[a-zA-Z0-9]/
  };
  clearOnBlur:boolean = true;
  clearOnBlurPlaceholder:boolean = false;
  escChar:string = '\\';
  eventsToHandle:string[] = ['input', 'keyup', 'click', 'focus'];
  addDefaultPlaceholder:boolean = true;
  allowInvalidValue:boolean = false;
}

class MaskModel {
  private _input:HTMLInputElement;
  value:any;
  valid:boolean = true;

  public get viewModel():string {
    return this._input.value;
  }

  public set viewModel(value:string) {
    this._input.value = value;
  }

  constructor(input:HTMLInputElement) {
    this._input = input;
  }
}

@Directive({
  selector: '[mask-input]',
  providers: [DefaultValueAccessor, MASK_VALUE_ACCESSOR]
})
export class MaskSelector implements ControlValueAccessor{

  @Input('mask-input')
  mask:string;

  private input:HTMLInputElement;

  private placeholder:string = '_';
  private maskComponents:any[] = [];
  private maskCaretMap:any[] = [];
  private oldCaretPosition:number = 0;
  private oldSelectionLength:number = 0;
  private oldValue:string;
  private oldValueUnmasked:string;
  private maskPlaceholder:string;
  private maskPatterns:any[];
  private minRequiredLength:number;
  private maskProcessed:boolean;
  private linkOptions:LinkOptions = new LinkOptions();
  private viewValue:any;
  private modelValue:any;
  private eventsBound:boolean = false;
  private model:MaskModel;
  private valueMasked:string;
  private prevValue:string;
  private preventBackspace:boolean;
  private isBlurEvent:boolean;
  private isMouseDownEvent:boolean;
  private isMouseOutEvent:boolean;
  private isMouseUpEvent:boolean;
  private isKeyDownEvent:boolean;
  private isInputEvent:boolean;
  private isKeyUpEvent:boolean;
  private isFocusEvent:boolean;
  private isClickEvent:boolean;

  onModelChange:Function = (value:any) => {};
  onModelTouched:Function = () => {};


  @HostListener('blur') onBlur() {
    if (this.eventsBound && this.isBlurEvent) this.blurHandler();
  }

  @HostListener('mousedown') onMouseDown() {
    if (this.eventsBound && this.isMouseDownEvent) this.mouseDownUpHandler(event);
  }

  @HostListener('mouseout') onMouseOut() {
    if (this.eventsBound && this.isMouseOutEvent) this.mouseOutHandler(event);
  }

  @HostListener('mouseup') onMouseUp() {
    if (this.eventsBound && this.isMouseUpEvent) this.mouseDownUpHandler(event);
  }

  @HostListener('keydown') onKeyDown() {
    if (this.eventsBound && this.isKeyDownEvent) this.keyDownHandler(event);
  }

  @HostListener('input') onInput() {
    if (this.eventsBound && this.isInputEvent) this.eventHandler(event);
  }

  @HostListener('keyup') onKeyUp() {
    if (this.eventsBound && this.isKeyUpEvent) this.eventHandler(event);
  }

  @HostListener('click') onClick() {
    if (this.eventsBound && this.isClickEvent) this.eventHandler(event);
  }

  @HostListener('focus') onFocus() {
    if (this.eventsBound && this.isFocusEvent) this.eventHandler(event);
  }


  private mouseDownUpHandler(e) {
    if (e.type === 'mousedown') {
      this.isMouseOutEvent = true;
    } else {
      this.isMouseOutEvent = false;
    }
  }

  private mouseOutHandler(e) {
    /*jshint validthis: true */
    this.oldSelectionLength = this.getSelectionLength(this.input);
    this.isMouseOutEvent = false;
  }

  private keyDownHandler(e) {
    /*jshint validthis: true */
    var isKeyBackspace = e.which === 8,
      caretPos = this.getCaretPosition(this.input) - 1 || 0; //value in keydown is pre change so bump caret position back to simulate post change

    if (isKeyBackspace) {
      while (caretPos >= 0) {
        if (this.isValidCaretPosition(caretPos)) {
          //re-adjust the caret position.
          //Increment to account for the initial decrement to simulate post change caret position
          this.setCaretPosition(this.input, caretPos + 1);
          break;
        }
        caretPos--;
      }
      this.preventBackspace = caretPos === -1;
    }
  }

  private eventHandler(e) {
    /*jshint validthis: true */
    e = e || {};
    // Allows more efficient minification
    var eventWhich = e.which,
      eventType = e.type;

    // Prevent shift and ctrl from mucking with old values
    if (eventWhich === 16 || eventWhich === 91) {
      return;
    }
    let val:string = this.input.value || '';
    let valOld:string = this.oldValue;
    let valMasked:string = '';
    let valAltered:boolean = false;
    let valUnmasked:string = this.unmaskValue(val);
    let valUnmaskedOld:string = this.oldValueUnmasked;
    let caretPos:number = this.getCaretPosition(this.input) || 0;
    let caretPosOld:number = this.oldCaretPosition || 0;
    let caretPosDelta:number = caretPos - caretPosOld;
    let caretPosMin:number = this.maskCaretMap[0];
    let caretPosMax:number = this.maskCaretMap[valUnmasked.length] || this.maskCaretMap.slice().shift();
    let selectionLenOld:number = this.oldSelectionLength || 0;
    let isSelected:boolean = this.getSelectionLength(this.input) > 0;
    let wasSelected:boolean = selectionLenOld > 0;
    // Case: Typing a character to overwrite a selection
    if (!valOld) valOld = val || '';
    let isAddition:boolean = (val.length > valOld.length) || (selectionLenOld && val.length > valOld.length - selectionLenOld);
    // Case: Delete and backspace behave identically on a selection
    let isDeletion:boolean = (val.length < valOld.length) || (selectionLenOld && val.length === valOld.length - selectionLenOld);
    let isSelection:boolean = (eventWhich >= 37 && eventWhich <= 40) && e.shiftKey; // Arrow key codes
    let isKeyLeftArrow:boolean = eventWhich === 37;
    // Necessary due to "input" event not providing a key code
    let isKeyBackspace:boolean = eventWhich === 8 || (eventType !== 'keyup' && isDeletion && (caretPosDelta === -1));
    let isKeyDelete:boolean = eventWhich === 46 || (eventType !== 'keyup' && isDeletion && (caretPosDelta === 0) && !wasSelected);
    // Handles cases where caret is moved and placed in front of invalid maskCaretMap position. Logic below
    // ensures that, on click or leftward caret placement, caret is moved leftward until directly right of
    // non-mask character. Also applied to click since users are (arguably) more likely to backspace
    // a character when clicking within a filled input.
    let caretBumpBack:boolean = (isKeyLeftArrow || isKeyBackspace || eventType === 'click') && caretPos > caretPosMin;

    this.oldSelectionLength = this.getSelectionLength(this.input);

    // These events don't require any action
    if (isSelection || (isSelected && (eventType === 'click' || eventType === 'keyup' || eventType === 'focus'))) {
      return;
    }

    if (isKeyBackspace && this.preventBackspace) {
      this.input.value = this.maskPlaceholder;
      // This shouldn't be needed but for some reason after aggressive backspacing the controller $viewValue is incorrect.
      // This keeps the $viewValue updated and correct.
      // scope.$apply(function () {
      //   controller.$setViewValue(''); // $setViewValue should be run in angular context, otherwise the changes will be invisible to angular and user code.
      // });
      //this.model.viewToModelUpdate('');
      this.onModelChange('');
      this.setCaretPosition(this.input, caretPosOld);
      return;
    }

    // Value Handling
    // ==============

    // User attempted to delete but raw value was unaffected--correct this grievous offense
    if ((eventType === 'input') && isDeletion && !wasSelected && valUnmasked === valUnmaskedOld) {
      while (isKeyBackspace && caretPos > caretPosMin && !this.isValidCaretPosition(caretPos)) {
        caretPos--;
      }
      while (isKeyDelete && caretPos < caretPosMax && this.maskCaretMap.indexOf(caretPos) === -1) {
        caretPos++;
      }
      let charIndex:number = this.maskCaretMap.indexOf(caretPos);
      // Strip out non-mask character that user would have deleted if mask hadn't been in the way.
      valUnmasked = valUnmasked.substring(0, charIndex) + valUnmasked.substring(charIndex + 1);

      // If value has not changed, don't want to call $setViewValue, may be caused by IE raising input event due to placeholder
      if (valUnmasked !== valUnmaskedOld)
        valAltered = true;
    }

    // Update values
    valMasked = this.maskValue(valUnmasked);

    this.oldValue = valMasked;
    this.oldValueUnmasked = valUnmasked;

    //additional check to fix the problem where the viewValue is out of sync with the value of the element.
    //better fix for commit 2a83b5fb8312e71d220a497545f999fc82503bd9 (I think)
    if (!valAltered && val.length > valMasked.length)
      valAltered = true;

    //this.model.valueAccessor.writeValue(valMasked);
    this.input.value = valMasked;

    //we need this check.  What could happen if you don't have it is that you'll set the model value without the user
    //actually doing anything.  Meaning, things like pristine and touched will be set.
    if (valAltered) {
      setTimeout(() => {
        //this.model.viewToModelUpdate(valUnmasked);
        this.onModelChange(valUnmasked);
      }, 0);
    }

    // Caret Repositioning
    // ===================
    // Ensure that typing always places caret ahead of typed character in cases where the first char of
    // the input is a mask char and the caret is placed at the 0 position.
    if (isAddition && (caretPos <= caretPosMin)) {
      caretPos = caretPosMin + 1;
    }

    if (caretBumpBack) {
      caretPos--;
    }

    // Make sure caret is within min and max position limits
    caretPos = caretPos > caretPosMax ? caretPosMax : caretPos < caretPosMin ? caretPosMin : caretPos;

    // Scoot the caret back or forth until it's in a non-mask position and within min/max position limits
    while (!this.isValidCaretPosition(caretPos) && caretPos > caretPosMin && caretPos < caretPosMax) {
      caretPos += caretBumpBack ? -1 : 1;
    }

    if ((caretBumpBack && caretPos < caretPosMax) || (isAddition && !this.isValidCaretPosition(caretPosOld))) {
      caretPos++;
    }
    this.oldCaretPosition = caretPos;
    this.setCaretPosition(this.input, caretPos);
  }

  private blurHandler():void {
    let value:string = this.input.value; // Not sure?
    if (this.linkOptions.clearOnBlur || ((this.linkOptions.clearOnBlurPlaceholder) && (value.length === 0) )) { //&& iAttrs.placeholder
      this.oldCaretPosition = 0;
      this.oldSelectionLength = 0;
      if (!this.model.valid || (this.model.value === null)) { //  this.model.value.length === 0
        this.valueMasked = '';
        this.input.value = '';
        //this.model.viewToModelUpdate('');
        this.onModelChange('');
      }
    }
    //Check for different value and trigger change.
    //Check for different value and trigger change.
    if (value !== this.prevValue) {
      // #157 Fix the bug from the trigger when backspacing exactly on the first letter (emptying the field)
      // and then blurring out.
      // Angular uses html element and calls setViewValue(element.value.trim()), setting it to the trimmed mask
      // when it should be empty
      let currentVal:string = value;
      let isTemporarilyEmpty:boolean = value === ''; // && currentVal; //&& angular.isDefined(iAttrs.uiMaskPlaceholderChar) && iAttrs.uiMaskPlaceholderChar === 'space';
      if (isTemporarilyEmpty) {
        this.input.value = '';
      }
      this.triggerChangeEvent(this.input);
      if (isTemporarilyEmpty) {
        this.input.value = currentVal;
      }
    }
    this.prevValue = value;
  }

  private triggerChangeEvent(element:any) {
    let change:Event;
    if (typeof window.event === 'function' && !element.fireEvent) {
      // modern browsers and Edge
      change = new Event('change', {
        //view: window,
        bubbles: true,
        cancelable: false
      });
      element.dispatchEvent(change);
    } else if ('createEvent' in document) {
      // older browsers
      change = document.createEvent('HTMLEvents');
      change.initEvent('change', false, true);
      element.dispatchEvent(change);
    }
    else if (element.fireEvent) {
      // IE <= 11
      element.fireEvent('onchange');
    }
  }


  public constructor(private el:ElementRef) {
    this.input = this.el.nativeElement;
    this.model = new MaskModel(this.input);
  }

  ngOnInit() {
    if(this.mask) { // If mask is not valid then no action.
      this.initialize();
      this.eventHandler({});
    }
  }

  private initialize() {
    if (!this.mask) {
      return this.uninitialize();
    }
    this.processRawMask(this.mask);
    if (!this.maskProcessed) {
      return this.uninitialize();
    }
    this.initializeElement();
    this.bindEventListeners();
    return true;
  }

  private uninitialize() {
    //let ngModel:NgModel = this.model as NgModel;
    this.maskProcessed = false;
    this.unbindEventListeners();
    //
    // if (angular.isDefined(originalPlaceholder)) {
    //   iElement.attr('placeholder', originalPlaceholder);
    // } else {
    //   iElement.removeAttr('placeholder');
    // }
    //
    // if (angular.isDefined(originalMaxlength)) {
    //   iElement.attr('maxlength', originalMaxlength);
    // } else {
    //   iElement.removeAttr('maxlength');
    // }

    //iElement.val(controller.$modelValue);
    this.input.value = this.model.value;
    this.modelValue = this.model.value;
    this.viewValue = this.model.viewModel;
    return false;
  }

  private bindEventListeners() {
    if (this.eventsBound) {
      return;
    }
    // iElement.bind('blur', blurHandler);
    // iElement.bind('mousedown mouseup', mouseDownUpHandler);
    // iElement.bind('keydown', keydownHandler);
    // TODO: Need to find a solution here.
    // Maybe declare EventEmitter?
    // iElement.bind(linkOptions.eventsToHandle.join(' '), eventHandler);
    this.isBlurEvent = true;
    this.isMouseDownEvent = true;
    this.isMouseUpEvent = true;
    this.isKeyDownEvent = true;
    this.isKeyUpEvent = true;
    this.isInputEvent = true;
    this.isClickEvent = true;
    this.isFocusEvent = true;
    this.eventsBound = true;
  }

  private initializeElement() {
    var value = this.oldValueUnmasked = this.unmaskValue(this.model.value || '');
    this.valueMasked = this.oldValue = this.maskValue(value);

    // isValid = validateValue(value);
    // if (iAttrs.maxlength) { // Double maxlength to allow pasting new val at end of mask
    //   iElement.attr('maxlength', maskCaretMap[maskCaretMap.length - 1] * 2);
    // }
    // if ( ! originalPlaceholder && linkOptions.addDefaultPlaceholder) {
    //   iElement.attr('placeholder', maskPlaceholder);
    // }
    var viewValue = this.model.viewModel;
    // var idx = controller.$formatters.length;
    // while(idx--) {
    //   viewValue = controller.$formatters[idx](viewValue);
    // }
    // controller.$viewValue = viewValue || '';
    this.model.viewModel = this.valueMasked;
    //this.model.viewToModelUpdate(value);
    this.onModelChange(value);
    // controller.$render();
    // Not using $setViewValue so we don't clobber the model value and dirty the form
    // without any kind of user interaction.

    //console.log('Masked value=' + this.valueMasked + ', value=' + value + ',oldValueUnmasked=' + this.ngModel.value + ', ngModel.viewModel=' + this.ngModel.viewModel);
  }

  private unbindEventListeners() {
    if (!this.eventsBound) {
      return;
    }
    this.isBlurEvent = false;
    this.isMouseDownEvent = false;
    this.isMouseUpEvent = false;
    this.isKeyDownEvent = false;
    this.isKeyUpEvent = false;
    this.isInputEvent = false;
    this.isClickEvent = false;
    this.isFocusEvent = false;
    this.eventsBound = false;
  }

  private  maskValue(unmaskedValue:string):string {
    var valueMasked = '',
      maskCaretMapCopy = this.maskCaretMap.slice();
    this.maskPlaceholder.split('').forEach((chr:string, i:number) => {
      if (unmaskedValue.length && i === maskCaretMapCopy[0]) {
        valueMasked += unmaskedValue.charAt(0) || '_';
        unmaskedValue = unmaskedValue.substr(1);
        maskCaretMapCopy.shift();
      }
      else {
        valueMasked += chr;
      }
    });
    return valueMasked;
  }

  private unmaskValue(value:string):string {
    var valueUnmasked = '',
      input = this.input,
      maskPatternsCopy = this.maskPatterns.slice(),
      selectionStart = this.oldCaretPosition,
      selectionEnd = selectionStart + this.getSelectionLength(input),
      valueOffset, valueDelta, tempValue = '';
    // Preprocess by stripping mask components from value
    value = value.toString();
    valueOffset = 0;
    valueDelta = value.length - this.placeholder.length;
    this.maskComponents.forEach(component => {
      var position = component.position;
      //Only try and replace the component if the component position is not within the selected range
      //If component was in selected range then it was removed with the user input so no need to try and remove that component
      if (!(position >= selectionStart && position < selectionEnd)) {
        if (position >= selectionStart) {
          position += valueDelta;
        }
        if (value.substring(position, position + component.value.length) === component.value) {
          tempValue += value.slice(valueOffset, position);// + value.slice(position + component.value.length);
          valueOffset = position + component.value.length;
        }
      }
    });
    value = tempValue + value.slice(valueOffset);
    value.split('').forEach(chr => {
      if (maskPatternsCopy.length && maskPatternsCopy[0].test(chr)) {
        valueUnmasked += chr;
        maskPatternsCopy.shift();
      }
    });

    return valueUnmasked;
  }

  private getSelectionLength(input) {
    if (!input)
      return 0;
    if (input.selectionStart !== undefined) {
      return (input.selectionEnd - input.selectionStart);
    }
    if (window.getSelection) {
      return (window.getSelection().toString().length);
    }
    // was removed from typescript?!
    // if (document.selection) {
    //   return (document.selection.createRange().text.length);
    // }
    return 0;
  }

  private processRawMask(mask:string) {
    var characterCount = 0;

    this.maskCaretMap = [];
    this.maskPatterns = [];
    this.maskPlaceholder = '';

    if (this.mask) {
      this.minRequiredLength = 0;

      var isOptional = false,
        numberOfOptionalCharacters = 0,
        splitMask = mask.split('');

      var inEscape = false;
      splitMask.forEach((chr:string, i:number) => {
        if (inEscape) {
          inEscape = false;
          this.maskPlaceholder += chr;
          characterCount++;
        }
        else if (this.linkOptions.escChar === chr) {
          inEscape = true;
        }
        else if (this.linkOptions.maskDefinitions[chr]) {
          this.maskCaretMap.push(characterCount);

          this.maskPlaceholder += this.getPlaceholderChar(i - numberOfOptionalCharacters);
          this.maskPatterns.push(this.linkOptions.maskDefinitions[chr]);

          characterCount++;
          if (!isOptional) {
            this.minRequiredLength++;
          }

          isOptional = false;
        }
        else if (chr === '?') {
          isOptional = true;
          numberOfOptionalCharacters++;
        }
        else {
          this.maskPlaceholder += chr;
          characterCount++;
        }
      });
    }
    // Caret position immediately following last position is valid.
    this.maskCaretMap.push(this.maskCaretMap.slice().pop() + 1);

    this.maskComponents = this.getMaskComponents();
    this.maskProcessed = this.maskCaretMap.length > 1 ? true : false;
  }

  private getPlaceholderChar(i:number):string {
    // var placeholder = angular.isDefined(iAttrs.uiMaskPlaceholder) ? iAttrs.uiMaskPlaceholder : iAttrs.placeholder,
    //   defaultPlaceholderChar;

    // if (angular.isDefined(placeholder) && placeholder[i]) {
    //   return placeholder[i];
    // } else {
    //   defaultPlaceholderChar = angular.isDefined(iAttrs.uiMaskPlaceholderChar) && iAttrs.uiMaskPlaceholderChar ? iAttrs.uiMaskPlaceholderChar : '_';
    //   return (defaultPlaceholderChar.toLowerCase() === 'space') ? ' ' : defaultPlaceholderChar[0];
    // }
    return '_';
  }

  private getMaskComponents() {
    var maskPlaceholderChars = this.maskPlaceholder.split(''),
      maskPlaceholderCopy, components;

    //maskCaretMap can have bad values if the input has the ui-mask attribute implemented as an obversable property, e.g. the demo page
    if (this.maskCaretMap && !isNaN(this.maskCaretMap[0])) {
      //Instead of trying to manipulate the RegEx based on the placeholder characters
      //we can simply replace the placeholder characters based on the already built
      //maskCaretMap to underscores and leave the original working RegEx to get the proper
      //mask components
      this.maskCaretMap.forEach(value => {
        maskPlaceholderChars[value] = '_';
      });
    }
    maskPlaceholderCopy = maskPlaceholderChars.join('');
    components = maskPlaceholderCopy.replace(/[_]+/g, '_').split('_');
    components = components.filter(function (s) {
      return s !== '';
    });

    // need a string search offset in cases where the mask contains multiple identical components
    // E.g., a mask of 99.99.99-999.99
    var offset = 0;
    return components.map(function (c) {
      var componentPosition = maskPlaceholderCopy.indexOf(c, offset);
      offset = componentPosition + 1;
      return {
        value: c,
        position: componentPosition
      };
    });
  }

  private isValidCaretPosition(pos:number):boolean {
    return this.maskCaretMap.indexOf(pos) > -1;
  }

  private getCaretPosition(input) {
    if (!input)
      return 0;
    if (input.selectionStart !== undefined) {
      return input.selectionStart;
    } else if (document.getSelection) {
      if (this.isFocused(input)) {
        // Curse you IE
        input.focus();
        var selection = document.getSelection().getRangeAt(0);
        // selection.moveStart('character', input.value ? -input.value.length : 0);
        selection.setStart(this.input, input.value ? -input.value.length : 0);
        // TODO: Check.
        return selection['text'].length;
      }
    }
    return 0;
  }

  private setCaretPosition(input, pos:number) {
    if (!input)
      return 0;
    if (input.offsetWidth === 0 || input.offsetHeight === 0) {
      return; // Input's hidden
    }
    if (input.setSelectionRange) {
      if (this.isFocused(input)) {
        input.focus();
        input.setSelectionRange(pos, pos);
      }
    }
    else if (input.createTextRange) {
      // Curse you IE
      var range = input.createTextRange();
      range.collapse(true);
      range.moveEnd('character', pos);
      range.moveStart('character', pos);
      range.select();
    }
  }

  private isFocused(elem) {
    return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
  }

  writeValue(obj:any):void {
    this.model.value = obj;
  }

  registerOnChange(fn:any):void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn:any):void {
    this.onModelTouched = fn;
  }
}

/*!
 * @license
 * Copyright 2019 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* tslint:disable:component-selector no-input-rename */

import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { FormService } from './../../../services/form.service';
import { baseHost, WidgetComponent } from './../widget.component';

@Component({
    selector: 'checkbox-widget',
    templateUrl: './checkbox.widget.html',
    host: baseHost,
    encapsulation: ViewEncapsulation.None
})
export class CheckboxWidgetComponent extends WidgetComponent implements OnInit {
    checkboxValue: boolean;

    constructor(public formService: FormService) {
        super(formService);
    }

    ngOnInit() {
        this.checkboxValue = this.parseValue(this.field.value);
    }

    parseValue(value: any) {
        return value === true || value === 'true';
    }

    onCheckboxToggled() {
        this.field.value = this.checkboxValue;
        this.onFieldChanged(this.field);
    }
}

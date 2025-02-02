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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { setupTestBed } from '../../../../testing/setup-test-bed';
import { MultilineTextWidgetComponentComponent } from './multiline-text.widget';
import { CoreTestingModule } from '../../../../testing/core.testing.module';
import { FormFieldModel } from '../core/form-field.model';
import { FormModel } from '../core/form.model';
import { FormFieldTypes } from '../core/form-field-types';

describe('MultilineTextWidgetComponentComponent', () => {

    let widget: MultilineTextWidgetComponentComponent;
    let fixture: ComponentFixture<MultilineTextWidgetComponentComponent>;
    let element: HTMLElement;

    setupTestBed({
        imports: [
            TranslateModule.forRoot(),
            CoreTestingModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MultilineTextWidgetComponentComponent);
        widget = fixture.componentInstance;
        element = fixture.nativeElement;
    });

    it('should exist', () => {
        expect(widget).toBeDefined();
    });

    describe('when is required', () => {

        beforeEach(() => {
            widget.field = new FormFieldModel( new FormModel({ taskId: '<id>' }), {
                type: FormFieldTypes.MULTILINE_TEXT,
                required: true
            });
        });

        it('should be marked as invalid after interaction', async () => {
            const multilineTextarea = fixture.nativeElement.querySelector('textarea');
            expect(fixture.nativeElement.querySelector('.adf-invalid')).toBeFalsy();

            multilineTextarea.dispatchEvent(new Event('blur'));

            fixture.detectChanges();
            await fixture.whenStable();

            expect(fixture.nativeElement.querySelector('.adf-invalid')).toBeTruthy();
        });

        it('should be able to display label with asterisk', async () => {
            fixture.detectChanges();
            await fixture.whenStable();

            const asterisk: HTMLElement = element.querySelector('.adf-asterisk');

            expect(asterisk).toBeTruthy();
            expect(asterisk.textContent).toEqual('*');
        });
    });
});

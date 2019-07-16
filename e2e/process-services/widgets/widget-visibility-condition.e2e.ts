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

import { AlfrescoApiCompatibility as AlfrescoApi } from '@alfresco/js-api';
import { LoginPage, Widget, BrowserActions } from '@alfresco/adf-testing';
import { browser } from 'protractor';
import resources = require('../../util/resources');
import { UsersActions } from '../../actions/users.actions';
import CONSTANTS = require('../../util/constants');
import { AppsActions } from '../../actions/APS/apps.actions';
import { TasksPage } from '../../pages/adf/process-services/tasksPage';

const widgets = {
    textOneId: 'text1',
    textTwoId: 'text2'
};

const value = {
    displayCheckbox: 'showCheck',
    displayFieldVariableCheckbox: 'showCheckText1',
    showVariableFieldCheckbox: 'showCheckText1',
    notDisplayCheckbox: 'anythingElse',
    displayVariableValueCheckbox: 'showCheck2'
};

const checkbox = {
    checkboxFieldValue : 'text1value',
    checkboxVariableField: 'variablefield',
    checkboxFieldVariable: 'text1variable',
    checkboxFieldField: 'text1text2',
    checkboxVariableValue: 'variablevalue',
    checkboxVariableVariable: 'variablevariable'
};

describe('Process-Services - Visibility conditions', () => {

    const loginPage = new LoginPage();

    let processUserModel;
    const taskPage = new TasksPage();
    const widget = new Widget();
    let alfrescoJsApi;
    const appsActions = new AppsActions();
    let appModel;
    const app = resources.Files.WIDGET_CHECK_APP.VISIBILITY;
    let deployedApp, process;

    beforeAll(async (done) => {
        const users = new UsersActions();

        alfrescoJsApi = new AlfrescoApi({
            provider: 'BPM',
            hostBpm: browser.params.testConfig.adf.url
        });

        await alfrescoJsApi.login(browser.params.testConfig.adf.adminEmail, browser.params.testConfig.adf.adminPassword);

        processUserModel = await users.createTenantAndUser(alfrescoJsApi);

        await alfrescoJsApi.login(processUserModel.email, processUserModel.password);
        appModel = await appsActions.importPublishDeployApp(alfrescoJsApi, resources.Files.WIDGET_CHECK_APP.file_location);

        const appDefinitions = await alfrescoJsApi.activiti.appsApi.getAppDefinitions();
        deployedApp = appDefinitions.data.find((currentApp) => {
            return currentApp.modelId === appModel.id;
        });
        process = await appsActions.startProcess(alfrescoJsApi, appModel, app.processName);
        await loginPage.loginToProcessServicesUsingUserModel(processUserModel);
        done();
    });

    beforeEach(() => {
        const urlToNavigateTo = `${browser.params.testConfig.adf.url}/activiti/apps/${deployedApp.id}/tasks/`;
        BrowserActions.getUrl(urlToNavigateTo);
        taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.MY_TASKS);
        taskPage.formFields().checkFormIsDisplayed();
    });

    afterAll(async (done) => {
        await alfrescoJsApi.activiti.processApi.deleteProcessInstance(process.id);
        await alfrescoJsApi.login(browser.params.testConfig.adf.adminEmail, browser.params.testConfig.adf.adminPassword);
        await alfrescoJsApi.activiti.adminTenantsApi.deleteTenant(processUserModel.tenantId);
        done();
    });

    it('[C309647] Should be able to see Checkbox widget when visibility condition refers to another field with specific value', () => {

        expect(widget.textWidget().isWidgetVisible(widgets.textOneId)).toBe(true);
        expect(widget.checkboxWidget().isCheckboxHidden(checkbox.checkboxFieldValue)).toBe(true);
        widget.textWidget().setValue(widgets.textOneId, value.displayCheckbox);
        expect(widget.checkboxWidget().isCheckboxDisplayed(checkbox.checkboxFieldValue)).toBe(true);
    });

    it('[C309648] Should be able to see Checkbox widget when visibility condition refers to a form variable and a field', () => {

        widget.textWidget().isWidgetVisible(widgets.textOneId);
        expect(widget.checkboxWidget().isCheckboxHidden(checkbox.checkboxVariableField)).toBe(true);

        widget.textWidget().setValue(widgets.textOneId, value.showVariableFieldCheckbox);
        expect(widget.checkboxWidget().isCheckboxDisplayed(checkbox.checkboxVariableField)).toBe(true);

        widget.textWidget().setValue(widgets.textOneId, value.notDisplayCheckbox);
        expect(widget.checkboxWidget().isCheckboxHidden(checkbox.checkboxVariableField)).toBe(true);
    });

    it('[C309649] Should be able to see Checkbox widget when visibility condition refers to a field and a form variable', () => {

        widget.textWidget().isWidgetVisible(widgets.textOneId);
        expect(widget.checkboxWidget().isCheckboxHidden(checkbox.checkboxFieldVariable)).toBe(true);

        widget.textWidget().setValue(widgets.textOneId, value.displayFieldVariableCheckbox);
        expect(widget.checkboxWidget().isCheckboxDisplayed(checkbox.checkboxFieldVariable)).toBe(true);

        widget.textWidget().setValue(widgets.textOneId, value.notDisplayCheckbox);
        widget.checkboxWidget().isCheckboxHidden(checkbox.checkboxFieldVariable);
    });

    it('[C311425] Should be able to see Checkbox widget when visibility condition refers to a field and another field', () => {

        widget.textWidget().isWidgetVisible(widgets.textOneId);
        expect(widget.checkboxWidget().isCheckboxHidden(checkbox.checkboxFieldField)).toBe(true);
        widget.textWidget().setValue(widgets.textOneId, value.displayCheckbox);
        widget.textWidget().setValue(widgets.textTwoId, value.displayCheckbox);
        expect(widget.checkboxWidget().isCheckboxDisplayed(checkbox.checkboxFieldField)).toBe(true);
    });

    it('[C311424] Should be able to see Checkbox widget when visibility condition refers to a variable with specific value', () => {
        expect(widget.checkboxWidget().isCheckboxDisplayed(checkbox.checkboxVariableValue)).toBe(true);
    });

    it('[C311426] Should be able to see Checkbox widget when visibility condition refers to form variable and another form variable', () => {
        expect(widget.checkboxWidget().isCheckboxDisplayed(checkbox.checkboxVariableVariable)).toBe(true);
    });
});
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

import { Injectable } from '@angular/core';
import { forkJoin, from, Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AppConfigService, AppConfigValues } from '../app-config/app-config.service';
import { OauthConfigModel } from '../models/oauth-config.model';
import { RedirectionModel } from '../models/redirection.model';
import { AlfrescoApiService } from './alfresco-api.service';
import { BaseAuthenticationService } from './base-authentication.service';
import { CookieService } from './cookie.service';
import { JwtHelperService } from './jwt-helper.service';
import { LogService } from './log.service';
import { StorageService } from './storage.service';

const REMEMBER_ME_COOKIE_KEY = 'ALFRESCO_REMEMBER_ME';
const REMEMBER_ME_UNTIL = 1000 * 60 * 60 * 24 * 30;

@Injectable({
    providedIn: 'root'
})
export class AuthenticationService extends BaseAuthenticationService {
    readonly supportCodeFlow = false;

    constructor(
        alfrescoApi: AlfrescoApiService,
        appConfig: AppConfigService,
        cookie: CookieService,
        logService: LogService,
        private storageService: StorageService
    ) {
        super(alfrescoApi, appConfig, cookie, logService);
        this.alfrescoApi.alfrescoApiInitialized.subscribe(() => {
            this.alfrescoApi.getInstance().reply('logged-in', () => {
                this.onLogin.next();
            });

            if (this.isKerberosEnabled()) {
                this.loadUserDetails();
            }
        });
    }

    private loadUserDetails() {
        const ecmUser$ = from(this.peopleApi.getPerson('-me-'));
        const bpmUser$ = this.getBpmLoggedUser();

        if (this.isALLProvider()) {
            forkJoin([ecmUser$, bpmUser$]).subscribe(() => this.onLogin.next());
        } else if (this.isECMProvider()) {
            ecmUser$.subscribe(() => this.onLogin.next());
        } else {
            bpmUser$.subscribe(() => this.onLogin.next());
        }
    }

    /**
     * Checks if the user logged in.
     *
     * @returns True if logged in, false otherwise
     */
    isLoggedIn(): boolean {
        if (!this.isOauth() && this.cookie.isEnabled() && !this.isRememberMeSet()) {
            return false;
        }
        return this.alfrescoApi.getInstance().isLoggedIn();
    }

    isLoggedInWith(provider: string): boolean {
        if (provider === 'BPM') {
            return this.isBpmLoggedIn();
        } else if (provider === 'ECM') {
            return this.isEcmLoggedIn();
        } else {
            return this.isLoggedIn();
        }
    }

    /**
     * Does the provider support OAuth?
     *
     * @returns True if supported, false otherwise
     */
    isOauth(): boolean {
        return this.alfrescoApi.getInstance().isOauthConfiguration();
    }

    /**
     * Logs the user in.
     *
     * @param username Username for the login
     * @param password Password for the login
     * @param rememberMe Stores the user's login details if true
     * @returns Object with auth type ("ECM", "BPM" or "ALL") and auth ticket
     */
    login(username: string, password: string, rememberMe: boolean = false): Observable<{ type: string; ticket: any }> {
        return from(this.alfrescoApi.getInstance().login(username, password)).pipe(
            map((response: any) => {
                this.saveRememberMeCookie(rememberMe);
                this.onLogin.next(response);
                return {
                    type: this.appConfig.get(AppConfigValues.PROVIDERS),
                    ticket: response
                };
            }),
            catchError((err) => this.handleError(err))
        );
    }

    /**
     * Logs the user in with SSO
     */
    ssoImplicitLogin() {
        this.alfrescoApi.getInstance().implicitLogin();
    }

    /**
     * Saves the "remember me" cookie as either a long-life cookie or a session cookie.
     *
     * @param rememberMe Enables a long-life cookie
     */
    private saveRememberMeCookie(rememberMe: boolean): void {
        let expiration = null;

        if (rememberMe) {
            expiration = new Date();
            const time = expiration.getTime();
            const expireTime = time + REMEMBER_ME_UNTIL;
            expiration.setTime(expireTime);
        }
        this.cookie.setItem(REMEMBER_ME_COOKIE_KEY, '1', expiration, null);
    }
    /**
     * Checks whether the "remember me" cookie was set or not.
     *
     * @returns True if set, false otherwise
     */
    isRememberMeSet(): boolean {
        return this.cookie.getItem(REMEMBER_ME_COOKIE_KEY) !== null;
    }

    /**
     * Logs the user out.
     *
     * @returns Response event called when logout is complete
     */
    logout() {
        return from(this.callApiLogout()).pipe(
            tap((response) => {
                this.onLogout.next(response);
                return response;
            }),
            catchError((err) => this.handleError(err))
        );
    }

    private callApiLogout(): Promise<any> {
        if (this.alfrescoApi.getInstance()) {
            return this.alfrescoApi.getInstance().logout();
        }
        return Promise.resolve();
    }

    /**
     * Checks if the user is logged in on an ECM provider.
     *
     * @returns True if logged in, false otherwise
     */
    isEcmLoggedIn(): boolean {
        if (this.isECMProvider() || this.isALLProvider()) {
            if (!this.isOauth() && this.cookie.isEnabled() && !this.isRememberMeSet()) {
                return false;
            }
            return this.alfrescoApi.getInstance().isEcmLoggedIn();
        }
        return false;
    }

    /**
     * Checks if the user is logged in on a BPM provider.
     *
     * @returns True if logged in, false otherwise
     */
    isBpmLoggedIn(): boolean {
        if (this.isBPMProvider() || this.isALLProvider()) {
            if (!this.isOauth() && this.cookie.isEnabled() && !this.isRememberMeSet()) {
                return false;
            }
            return this.alfrescoApi.getInstance().isBpmLoggedIn();
        }
        return false;
    }

    /** Sets the URL to redirect to after login.
     *
     * @param url URL to redirect to
     */
    setRedirect(url: RedirectionModel) {
        this.redirectUrl = url;
    }

    /** Gets the URL to redirect to after login.
     *
     * @returns The redirect URL
     */
    getRedirect(): string {
        const provider = this.appConfig.get<string>(AppConfigValues.PROVIDERS);
        return this.hasValidRedirection(provider) ? this.redirectUrl.url : null;
    }

    private hasValidRedirection(provider: string): boolean {
        return this.redirectUrl && (this.redirectUrl.provider === provider || this.hasSelectedProviderAll(provider));
    }

    private hasSelectedProviderAll(provider: string): boolean {
        return this.redirectUrl && (this.redirectUrl.provider === 'ALL' || provider === 'ALL');
    }

    isImplicitFlow(): boolean {
        const oauth2: OauthConfigModel = Object.assign({}, this.appConfig.get<OauthConfigModel>(AppConfigValues.OAUTHCONFIG, null));
        return !!oauth2?.implicitFlow;
    }

    isAuthCodeFlow(): boolean {
        return false;
    }

    /**
     * Gets the auth token.
     *
     * @returns Auth token string
     */
    getToken(): string {
        return this.storageService.getItem(JwtHelperService.USER_ACCESS_TOKEN);
    }
}

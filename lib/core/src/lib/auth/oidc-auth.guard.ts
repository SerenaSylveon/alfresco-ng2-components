import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class OidcAuthGuard implements CanActivate {
  constructor(private _auth: AuthService) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this._isAuthenticated(state);
  }

  canActivateChild(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this._isAuthenticated(state);
  }

  private _isAuthenticated(state: RouterStateSnapshot) {
    if (this._auth.authenticated) {
      return true;
    }

    const loginResult = this._auth.login(state.url);

    if (loginResult instanceof Promise) {
      return loginResult.then(() => true).catch(() => false);
    }

    return false;
  }

}

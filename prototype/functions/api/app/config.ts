import {json} from '../../_lib/db';
import type {Env} from '../../_lib/db';
import {appConfig} from '../../_lib/appver';

/** Which app builds are still allowed, and where to get the update. Public; the app reads it once at start-up. */
export const onRequestGet:PagesFunction<Env>=async({env})=>json(appConfig(env),200,'no-store');

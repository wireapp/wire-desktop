/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

export interface SsoPayload {
  label: string;
  errors?: string[];
}

// Accept only bounded backend error fields, never arbitrary page-supplied objects.
export function parseSsoPayload(value: unknown): SsoPayload | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const {label, errors} = value as {label?: unknown; errors?: unknown};
  if (typeof label !== 'string' || !/^[a-zA-Z0-9_-]{1,255}$/.test(label)) {
    return undefined;
  }
  if (
    errors !== undefined &&
    (!Array.isArray(errors) ||
      errors.length > 32 ||
      !errors.every(error => typeof error === 'string' && error.length <= 4096))
  ) {
    return undefined;
  }
  return {label, ...(errors !== undefined ? {errors: errors as string[]} : {})};
}

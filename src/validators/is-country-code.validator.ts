import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import countries from 'src/common/i18n-countries';

export type CountryCodeFormat = 'alpha2' | 'alpha3';

export interface IsCountryCodeOptions {
  format?: CountryCodeFormat; // 'alpha2' (افتراضي) أو 'alpha3'
  uppercase?: boolean; // حوّل لأحرف كبيرة قبل التحقق (افتراضي true)
  allowlist?: string[]; // قائمة دول مسموحة فقط (اختياري)
}

@ValidatorConstraint({ async: false })
class IsCountryCodeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args?: ValidationArguments): boolean {
    if (typeof value !== 'string') return false;

    const opts = (args?.constraints?.[0] || {}) as IsCountryCodeOptions;
    const format: CountryCodeFormat = opts.format ?? 'alpha2';
    const uppercase = opts.uppercase ?? true;
    const allowlist = opts.allowlist?.map((c) => c.toUpperCase());

    const v = uppercase ? value.toUpperCase() : value;

    // تحقّق بالشكل أولًا (طول الحروف)
    if (format === 'alpha2' && !/^[A-Za-z]{2}$/.test(v)) return false;
    if (format === 'alpha3' && !/^[A-Za-z]{3}$/.test(v)) return false;

    // تحقّق من وجود الدولة في المكتبة
    const isValid =
      format === 'alpha2'
        ? !!countries.getName(v, 'en') // وجود اسم يعني أنه كود صحيح
        : !!countries.alpha3ToAlpha2(v); // لو alpha3 حوّلها لـ alpha2 وتأكد

    if (!isValid) return false;

    // تحقّق من قائمة مسموحة (إن وُجدت)
    if (allowlist && allowlist.length > 0) {
      if (format === 'alpha2') {
        return allowlist.includes(v);
      } else {
        // في حال alpha3، حوّل لـ alpha2 وطبّق القائمة
        const a2 = countries.alpha3ToAlpha2(v);
        return !!a2 && allowlist.includes(a2.toUpperCase());
      }
    }

    return true;
  }

  defaultMessage(args?: ValidationArguments): string {
    const opts = (args?.constraints?.[0] || {}) as IsCountryCodeOptions;
    const format = opts.format ?? 'alpha2';
    return `countryCode must be a valid ISO 3166-1 ${format} code`;
  }
}

export function IsCountryCode(
  options?: IsCountryCodeOptions,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsCountryCode',
      target: object.constructor,
      propertyName,
      constraints: [options || {}],
      options: validationOptions,
      validator: IsCountryCodeConstraint,
    });
  };
}

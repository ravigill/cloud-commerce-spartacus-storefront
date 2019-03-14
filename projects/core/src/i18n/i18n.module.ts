import { NgModule, ModuleWithProviders } from '@angular/core';
import { TranslatePipe } from './translate.pipe';
import { i18nextProviders } from './i18next';
import { defaultTranslationConfig } from './config/default-i18n-config';
import { I18NConfig } from './config/i18n-config';
import { TranslationService } from './translation.service';
import { provideConfig, Config } from '../config/config.module';

@NgModule({
  declarations: [TranslatePipe],
  exports: [TranslatePipe]
})
export class I18NModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: I18NModule,
      providers: [
        provideConfig(defaultTranslationConfig),
        { provide: I18NConfig, useExisting: Config },
        TranslationService,
        ...i18nextProviders
      ]
    };
  }
}
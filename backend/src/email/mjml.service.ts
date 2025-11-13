import { Injectable } from '@nestjs/common';
import mjml2html from 'mjml';
import { mailTemplates } from './mail-templates';

@Injectable()
export class MJMLService {
  render(template: keyof typeof mailTemplates, data: any): string {
    const mjml = mailTemplates[template](data);
    const { html } = mjml2html(mjml, { minify: true });
    return html;
  }
}

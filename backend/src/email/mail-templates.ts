// MJML-baserade e-postmallar
export const mailTemplates = {
  welcome: ({ name }: { name: string }) => `
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text font-size="22px" color="#333">Välkommen, ${name}!</mj-text>
            <mj-text>Vi är glada att du valt WestWallet. Kom igång direkt!</mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `,
  invoice: ({ amount, dueDate }: { amount: number, dueDate: string }) => `
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text font-size="20px" color="#333">Faktura</mj-text>
            <mj-text>Belopp: <b>${amount} kr</b></mj-text>
            <mj-text>Förfallodatum: ${dueDate}</mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `,
  reminder: ({ message }: { message: string }) => `
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text font-size="18px" color="#333">Påminnelse</mj-text>
            <mj-text>${message}</mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `,
};

import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bullmq';

@Processor('mail')
export class MailWorker {
  @Process()
  async handleMail(job: Job) {
    // Exempel: skicka mail med data från job.data
    // Anropa EmailService eller direkt via SendGrid
    console.log('Mail-jobb:', job.data);
    // ...skicka mail här...
    return { success: true };
  }
}

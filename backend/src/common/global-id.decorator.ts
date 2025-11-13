import { getNextGlobalId } from '../utils/id-generator';

// Helper för att sätta globalt ID på en Mongoose-dokument
export async function assignGlobalId(doc: any, prefix = 'A') {
  if (!doc.globalId) {
    doc.globalId = await getNextGlobalId(prefix);
  }
}

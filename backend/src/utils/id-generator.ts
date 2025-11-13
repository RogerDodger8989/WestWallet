import Counter from '../models/counter.schema';

// Hämtar nästa globala ID i formatet A000001, A000002 osv
export async function getNextGlobalId(prefix = 'A'): Promise<string> {
  let result;
  try {
    result = await Counter.findByIdAndUpdate(
      'global',
      { $inc: { seq: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    const error: any = new Error('ID sequence update failed');
    error.errorCode = 'ID_SEQUENCE_FAILED';
    throw error;
  }
  const id = `${prefix}${String(result.seq).padStart(6, '0')}`;
  if (!/^A\d{6}$/.test(id)) {
    const error: any = new Error('ID does not match required format');
    error.errorCode = 'ID_FORMAT_INVALID';
    throw error;
  }
  return id;
}

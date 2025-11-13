import Counter from '../models/counter.schema';

// Hämtar nästa globala ID i formatet A000001, A000002 osv
export async function getNextGlobalId(prefix = 'A'): Promise<string> {
  const result = await Counter.findByIdAndUpdate(
    'global',
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return `${prefix}${String(result.seq).padStart(6, '0')}`;
}

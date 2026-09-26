/**
 * Document Encoding page.
 * STEP 2 (temporary): a preview of the fake documents so their look can be
 * reviewed. Step 3 turns this into the real practice page.
 */
import { useMemo, useState } from 'react';
import { Button, PageHeader, SegmentedPicker } from '../../components/ui';
import { makeRng, randomSeed } from '../../lib/random';
import DocumentView from './DocumentView';
import { DOC_INFO, DOC_TYPES, expectedValues, makeDocument, type DocType } from './documents';

export default function EncodingPage() {
  const [type, setType] = useState<DocType>('invoice');
  const [seed, setSeed] = useState(randomSeed);
  const doc = useMemo(() => makeDocument(makeRng(seed), type), [seed, type]);
  const expected = expectedValues(doc);

  return (
    <div>
      <PageHeader title="Document Encoding (preview)" description="Pansamantalang preview ng itsura ng mga dokumento." />
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <SegmentedPicker
          label="Dokumento"
          options={DOC_TYPES}
          value={type}
          format={(t) => DOC_INFO[t].label}
          onChange={setType}
        />
        <Button variant="secondary" onClick={() => setSeed(randomSeed())}>
          Ibang dokumento
        </Button>
      </div>
      <DocumentView doc={doc} />
      <pre className="mt-6 overflow-x-auto rounded bg-stone-100 p-3 text-sm">{JSON.stringify(expected, null, 2)}</pre>
    </div>
  );
}

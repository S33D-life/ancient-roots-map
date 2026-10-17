import Circle237Experience from '@/components/council/Circle237Experience';
import { ROUTES } from '@/lib/routes';
import { useDocumentTitle } from '@/hooks/use-document-title';

export default function Circle237Page() {
  useDocumentTitle('Council of Life · 237 · Draft');
  return <Circle237Experience basePath={ROUTES.CIRCLE237} />;
}

"use client";

import React, { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';

interface Inquiry {
  id: string;
  fields: Record<string, any>;
}

interface Props {
  inquiries: Inquiry[];
}

export default function MinorInquiriesList({ inquiries }: Props) {
  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 9;
  const pageCount = Math.ceil(inquiries.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const currentItems = inquiries.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentItems.map(({ id, fields }) => {
          const handleDownload = () => {
            const signature = (fields['Signatur'] || '').replace(/<br\s*\/?\>/gi, '\n');
            const parts = [
              fields.Rubrum || '',
              fields.Titel || '',
              `Berlin, den ${new Date(fields.Created).toLocaleDateString('de-DE')}`,
              '',
              'Vorbemerkung der Fragesteller:',
              fields['Vorbemerkung'] || '',
              '',
              'Wir fragen die Bundesregierung:',
              fields['Fragenteil'] || '',
              '',
              'Signatur:',
              signature,
              '',
              fields['Vorblatt_Heading'] || '',
              `Politische Zielsetzung: ${fields['Politische Zielsetzung'] || ''}`,
              `Öffentliche Botschaft: ${fields['Öffentliche Botschaft'] || ''}`,
              `Maßnahmen: ${fields['Maßnahmen'] || ''}`
            ];
            const text = parts.join('\n');
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fields.Titel}.txt`;
            link.click();
            URL.revokeObjectURL(url);
          };
          return (
            <Dialog key={id}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer group overflow-hidden">
                  <div className="relative h-40 w-full">
                    <img
                      src="/images/categories/ka.jpeg"
                      alt="Kleine Anfrage"
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 h-1/2"
                      style={{ background: 'linear-gradient(to top, hsl(326,100%,22%) 0%, transparent 100%)' }}
                    />
                    {fields.Politikfeld && (
                      <Badge variant="secondary" className="absolute top-2 left-2">
                        {fields.Politikfeld}
                      </Badge>
                    )}
                    <div className="absolute bottom-2 left-4 right-4">
                      <CardTitle className="text-white line-clamp-2 px-2">
                        {fields.Titel}
                      </CardTitle>
                    </div>
                  </div>
                  <CardContent className="mt-4 prose prose-sm max-w-none line-clamp-4 px-6">
                    {fields['Vorbemerkung'] || fields['Result final']}
                  </CardContent>
                  <CardFooter>
                    <button className="text-primary hover:underline">Ansehen</button>
                  </CardFooter>
                </Card>
              </DialogTrigger>
              <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogTitle className="sr-only">Kleine Anfrage: {fields.Titel}</DialogTitle>
                <div className="flex justify-end items-center">
                  <div className="text-sm text-muted-foreground">
                    Berlin, den {new Date(fields.Created).toLocaleDateString('de-DE')}
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <p className="leading-relaxed">&nbsp;</p>
                  <p className="leading-relaxed">&nbsp;</p>
                  <div className="text-lg font-heading-light">
                    {fields.Rubrum}
                  </div>
                  <div className="text-2xl font-heading-black">
                    {fields.Titel}
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-6">
                  <div>
                    <div className="font-bold">Vorbemerkung der Fragesteller:</div>
                    <div>{fields['Vorbemerkung']}</div>
                  </div>
                  <div>
                    <div className="font-bold">Wir fragen die Bundesregierung:</div>
                    {(() => {
                      const text = fields['Fragenteil'] as string;
                      const items = text.split(/\s*\d+\.\s*/).filter(Boolean);
                      return (
                        <ul className="list-decimal list-inside space-y-1 mt-2">
                          {items.map((item, i) => (
                            <li key={i}>{item.trim()}</li>
                          ))}
                        </ul>
                      );
                    })()}
                  </div>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: (fields['Signatur'] as string).replace(/<br\s*\/?\>/, '<br/><br/>'),
                    }}
                  />
                  <Separator className="my-4" />
                  <div className="prose max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: `${fields['Vorblatt_Heading']}<br/><br/>
Politische Zielsetzung:<br/>${fields['Politische Zielsetzung']}<br/><br/>
Öffentliche Botschaft:<br/>${fields['Öffentliche Botschaft']}<br/><br/>
Maßnahmen:<br/>${fields['Maßnahmen']}`
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleDownload} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download TXT
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
      {pageCount > 1 && (
        <Pagination className="mt-4">
          <PaginationPrevious
            onClick={() => page > 1 && setPage(page - 1)}
            className={page === 1 ? "pointer-events-none opacity-50" : ""}
          />
          <PaginationContent>
            {Array.from({ length: pageCount }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink isActive={i + 1 === page} onClick={() => setPage(i + 1)}>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
          </PaginationContent>
          <PaginationNext
            onClick={() => page < pageCount && setPage(page + 1)}
            className={page === pageCount ? "pointer-events-none opacity-50" : ""}
          />
        </Pagination>
      )}
    </div>
  );
} 
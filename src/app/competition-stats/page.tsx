
"use client"
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useIsMobile } from "@/hooks/use-mobile"; 

// Updated colors to use theme variables (approximated with HSL strings for Recharts)
const stateGroupData = [
  { name: 'NRW', inquiries: 45, color: "hsl(var(--primary))" }, // Primary
  { name: 'Bayern', inquiries: 38, color: "hsl(var(--accent))"  }, // Accent
  { name: 'Baden-W.', inquiries: 32, color: "hsl(var(--secondary))"  }, // Secondary
  { name: 'Niedersachsen', inquiries: 28, color: "hsla(var(--primary), 0.7)"  }, // Primary with alpha
  { name: 'Hessen', inquiries: 25, color: "hsla(var(--accent), 0.7)"  }, // Accent with alpha
  { name: 'Sachsen', inquiries: 22, color: "hsla(var(--secondary), 0.7)"  }, // Secondary with alpha
  { name: 'Berlin', inquiries: 19, color: "hsla(var(--primary), 0.5)"  }, // Primary with more alpha
];

const committeeData = [
  { name: 'Haushalt', inquiries: 55, color: "hsl(var(--primary))" }, 
  { name: 'Inneres', inquiries: 48, color: "hsl(var(--accent))" }, 
  { name: 'Umwelt', inquiries: 42, color: "hsl(var(--secondary))" }, 
  { name: 'Wirtschaft', inquiries: 35, color: "hsla(var(--primary), 0.7)" },
  { name: 'Soziales', inquiries: 30, color: "hsla(var(--accent), 0.7)" },
];

export default function CompetitionStatsPage() {
  const isMobile = useIsMobile();

  return (
    <PageLayout
      title="Wettbewerbsstatistiken"
      description="Einblicke in die Einreichungen von Kleinen Anfragen nach Landesgruppen und Ausschüssen."
    >
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading-light">Anfragen nach Landesgruppe (MdB)</CardTitle>
            <CardDescription>Anzahl der von MdBs der jeweiligen Landesverbände eingereichten Kleinen Anfragen.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stateGroupData} layout={isMobile ? "vertical" : "horizontal"} margin={{ top: 5, right: isMobile? 10 : 30, left: isMobile ? 50 :20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                {isMobile ? (
                    <>
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" axisLine={{ stroke: "hsl(var(--border))" }} tickLine={{ stroke: "hsl(var(--border))" }} />
                        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" width={100} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={{ stroke: "hsl(var(--border))" }} />
                    </>
                ) : (
                    <>
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" axisLine={{ stroke: "hsl(var(--border))" }} tickLine={{ stroke: "hsl(var(--border))" }}/>
                        <YAxis stroke="hsl(var(--muted-foreground))" axisLine={{ stroke: "hsl(var(--border))" }} tickLine={{ stroke: "hsl(var(--border))" }} />
                    </>
                )}
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontFamily: 'var(--font-inter)'}} 
                  labelStyle={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-work-sans)' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [value, "Anfragen"]} 
                />
                <Legend wrapperStyle={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-inter)' }} formatter={(value) => "Eingereichte Anfragen"} />
                <Bar dataKey="inquiries" name="Eingereichte Anfragen" legendType="rect">
                    {stateGroupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} radius={[4, 4, 0, 0]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading-light">Anfragen nach Ausschuss</CardTitle>
            <CardDescription>Verteilung der Kleinen Anfragen auf verschiedene parlamentarische Ausschüsse.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={committeeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={isMobile ? 80 : 100}
                  dataKey="inquiries"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  stroke="hsl(var(--background))" // Add stroke for better separation
                >
                  {committeeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontFamily: 'var(--font-inter)'}}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-work-sans)' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => [value, name]}
                />
                <Legend wrapperStyle={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-inter)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

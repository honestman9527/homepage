import { Card, CardFooter, CardHeader, CardTitle } from "@/components/react/ui/card";
import { Badge } from "@/components/react/ui/badge";

interface Props {
  name: string;
  href: string;
  countLabel: string;
}

export function TagCard({ name, href, countLabel }: Props) {
  return (
    <article className="content-card">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>
              <a className="card-title-link" href={href}>
                {name}
              </a>
            </h2>
          </CardTitle>
        </CardHeader>
        <CardFooter>
          <Badge variant="secondary">{countLabel}</Badge>
        </CardFooter>
      </Card>
    </article>
  );
}

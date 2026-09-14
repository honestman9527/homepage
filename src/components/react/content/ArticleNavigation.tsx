import type { ArticleNavigation as ArticleNavigationData } from "@/lib/content/blog";
import { Badge } from "@/components/react/ui/badge";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/react/ui/card";

interface Props {
  navigation: ArticleNavigationData;
  labels: { older: string; newer: string };
}

export function ArticleNavigation({ navigation, labels }: Props) {
  const items = [
    navigation.older
      ? { ...navigation.older, label: labels.older, direction: "older" }
      : undefined,
    navigation.newer
      ? { ...navigation.newer, label: labels.newer, direction: "newer" }
      : undefined,
  ].filter((item) => item !== undefined);

  if (!items.length) return null;

  return (
    <nav className="article-navigation" aria-label={`${labels.older} / ${labels.newer}`}>
      {items.map((item) => (
        <Card
          key={item.direction}
          size="sm"
          className="article-navigation-card"
          data-direction={item.direction}
        >
          <CardHeader>
            <CardDescription>{item.label}</CardDescription>
            <CardTitle>
              <a className="article-navigation-link" href={item.href} lang={item.lang}>
                {item.title}
              </a>
            </CardTitle>
          </CardHeader>
          {item.originalLabel && (
            <CardFooter>
              <Badge variant="outline">{item.originalLabel}</Badge>
            </CardFooter>
          )}
        </Card>
      ))}
    </nav>
  );
}

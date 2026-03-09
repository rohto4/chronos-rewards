import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
  CardFooter,
} from './Card';

describe('Card', () => {
  it('renders each section with shared classes and extra className', () => {
    render(
      <Card data-testid="card" className="extra-card">
        <CardHeader className="header-extra">header</CardHeader>
        <CardTitle className="title-extra">title</CardTitle>
        <CardDescription className="description-extra">description</CardDescription>
        <CardBody className="body-extra">body</CardBody>
        <CardFooter className="footer-extra">footer</CardFooter>
      </Card>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-slate-900', 'border', 'border-slate-800', 'shadow-xl', 'extra-card');
    expect(screen.getByText('header')).toHaveClass('p-6', 'border-b', 'border-slate-800', 'header-extra');
    expect(screen.getByText('title')).toHaveClass('text-xl', 'font-semibold', 'text-slate-50', 'title-extra');
    expect(screen.getByText('description')).toHaveClass('text-sm', 'text-slate-400', 'mt-1.5', 'description-extra');
    expect(screen.getByText('body')).toHaveClass('p-6', 'body-extra');
    expect(screen.getByText('footer')).toHaveClass('p-6', 'border-t', 'border-slate-800', 'footer-extra');
  });

  it('applies outline variant classes when requested', () => {
    render(
      <Card data-testid="outline-card" variant="outline" className="variant-extra">
        outline
      </Card>
    );

    const outlinedCard = screen.getByTestId('outline-card');
    expect(outlinedCard).toHaveClass('border-2', 'border-slate-700', 'variant-extra');
  });

  it('switches to ghost variant styling when set', () => {
    render(
      <Card data-testid="ghost-card" variant="ghost">
        ghost
      </Card>
    );

    const ghostCard = screen.getByTestId('ghost-card');
    expect(ghostCard).toHaveClass('bg-slate-900/50', 'backdrop-blur-sm', 'border', 'border-slate-800/50');
  });
});

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '@/App';

describe('Dashboard Rendering', () => {
  test('renders metric cards and controls', async () => {
    render(<App />);
    // Wait for metric cards to appear (they may be async due to data fetching)
    const totalCostCard = await screen.findByText(/Total Cost/i);
    const totalTokensCard = await screen.findByText(/Total Tokens/i);
    const controls = await screen.findByRole('button', { name: /Pause/i });

    expect(totalCostCard).toBeInTheDocument();
    expect(totalTokensCard).toBeInTheDocument();
    expect(controls).toBeInTheDocument();
  });
});

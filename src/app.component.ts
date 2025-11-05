import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayrollService } from './services/payroll.service';
import { PayrollResult } from './payroll.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  providers: [PayrollService],
})
export class AppComponent {
  private payrollService = inject(PayrollService);

  // Input signals
  netSalary = signal(30_000_000);
  basicSalary = signal(5_200_000);
  nonTaxableIncome = signal(0);
  dependents = signal(1);

  // Output signal
  calculationResult = signal<PayrollResult | null>(null);

  // UI State Signals for collapsible sections
  isPitDetailVisible = signal(false);

  onCalculate(): void {
    // Reset detail visibility on new calculation
    this.isPitDetailVisible.set(false);

    const input = {
      netSalary: this.netSalary() || 0,
      basicSalary: this.basicSalary() || 0,
      nonTaxableIncome: this.nonTaxableIncome() || 0,
      dependents: this.dependents() || 0,
    };
    const result = this.payrollService.calculate(input);
    this.calculationResult.set(result);
  }

  updateSignal(signal: WritableSignal<number>, event: Event) {
    const input = event.target as HTMLInputElement;
    signal.set(input.valueAsNumber || 0);
  }
  
  onCurrencyInput(signal: WritableSignal<number>, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\./g, ''); // Remove existing dots
    const numberValue = parseInt(value, 10);
    signal.set(isNaN(numberValue) ? 0 : numberValue);
  }

  togglePitDetail(): void {
    this.isPitDetailVisible.update(v => !v);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value || 0);
  }
}
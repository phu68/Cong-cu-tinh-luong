import { Injectable } from '@angular/core';
import { PayrollInput, PayrollResult, SIDetail, PITDetail, PITBracket } from '../payroll.model';

@Injectable({
  providedIn: 'root',
})
export class PayrollService {
  // Constants based on current Vietnamese regulations
  private readonly DEDUCTION_SELF = 11_000_000;
  private readonly DEDUCTION_DEPENDENT = 4_400_000;
  
  // Employee SI Rates
  private readonly EMPLOYEE_BHXH_RATE = 0.08;
  private readonly EMPLOYEE_BHYT_RATE = 0.015;
  private readonly EMPLOYEE_BHTN_RATE = 0.01;
  private readonly EMPLOYEE_SI_TOTAL_RATE = this.EMPLOYEE_BHXH_RATE + this.EMPLOYEE_BHYT_RATE + this.EMPLOYEE_BHTN_RATE; // 10.5%

  // Employer SI Rates
  private readonly EMPLOYER_BHXH_RATE = 0.175;
  private readonly EMPLOYER_BHYT_RATE = 0.03;
  private readonly EMPLOYER_BHTN_RATE = 0.01;
  private readonly EMPLOYER_SI_TOTAL_RATE = this.EMPLOYER_BHXH_RATE + this.EMPLOYER_BHYT_RATE + this.EMPLOYER_BHTN_RATE; // 21.5%


  calculate(input: PayrollInput): PayrollResult {
    const { netSalary, basicSalary, nonTaxableIncome, dependents } = input;
    
    if (netSalary <= 0 || basicSalary <= 0) {
      return this.getEmptyResult(netSalary);
    }

    const employeeSI: SIDetail = {
      bhxh: basicSalary * this.EMPLOYEE_BHXH_RATE,
      bhyt: basicSalary * this.EMPLOYEE_BHYT_RATE,
      bhtn: basicSalary * this.EMPLOYEE_BHTN_RATE,
      total: basicSalary * this.EMPLOYEE_SI_TOTAL_RATE
    };

    const employerSI: SIDetail = {
      bhxh: basicSalary * this.EMPLOYER_BHXH_RATE,
      bhyt: basicSalary * this.EMPLOYER_BHYT_RATE,
      bhtn: basicSalary * this.EMPLOYER_BHTN_RATE,
      total: basicSalary * this.EMPLOYER_SI_TOTAL_RATE
    };

    const personalDeduction = this.DEDUCTION_SELF;
    const dependentDeduction = dependents * this.DEDUCTION_DEPENDENT;
    const personalDeductionsTotal = personalDeduction + dependentDeduction;
    
    const baseIncomeForConversion = netSalary - personalDeductionsTotal - employeeSI.total - nonTaxableIncome;

    let taxableIncome = 0;
    if (baseIncomeForConversion > 0) {
        taxableIncome = this.getTaxableIncomeFromConverted(baseIncomeForConversion);
    }
    
    const { pitAmount, pitBrackets } = this.calculatePITWithBrackets(taxableIncome);
    
    const grossSalary = netSalary + pitAmount + employeeSI.total;
    
    const totalSIContribution = employeeSI.total + employerSI.total;
    const totalPaidToGovt = totalSIContribution + pitAmount;
    const totalCompanyCost = grossSalary + employerSI.total;

    const pit: PITDetail = {
      totalIncome: grossSalary,
      personalDeduction,
      dependentDeduction,
      siDeduction: employeeSI.total,
      nonTaxableIncomeDeduction: nonTaxableIncome,
      taxableIncome,
      pitAmount,
      pitBrackets
    };

    return {
      grossSalary,
      employeeSI,
      pit,
      netSalary,
      employerSI,
      totalCompanyCost,
      totalPaidToGovt,
      totalSIContribution,
    };
  }

  private getEmptyResult(netSalary: number): PayrollResult {
     const emptySI: SIDetail = { bhxh: 0, bhyt: 0, bhtn: 0, total: 0 };
     const emptyPIT: PITDetail = {
       totalIncome: netSalary,
       personalDeduction: 0,
       dependentDeduction: 0,
       siDeduction: 0,
       nonTaxableIncomeDeduction: 0,
       taxableIncome: 0,
       pitAmount: 0,
       pitBrackets: []
     };
     return {
      grossSalary: netSalary,
      employeeSI: emptySI,
      pit: emptyPIT,
      netSalary: netSalary,
      employerSI: emptySI,
      totalCompanyCost: netSalary,
      totalPaidToGovt: 0,
      totalSIContribution: 0
    };
  }

  private getTaxableIncomeFromConverted(baseIncome: number): number {
    if (baseIncome <= 4_750_000) return baseIncome / 0.95;
    if (baseIncome <= 9_250_000) return (baseIncome - 250_000) / 0.9;
    if (baseIncome <= 16_050_000) return (baseIncome - 750_000) / 0.85;
    if (baseIncome <= 27_250_000) return (baseIncome - 1_650_000) / 0.8;
    if (baseIncome <= 42_250_000) return (baseIncome - 3_250_000) / 0.75;
    if (baseIncome <= 61_850_000) return (baseIncome - 5_850_000) / 0.7;
    return (baseIncome - 9_850_000) / 0.65;
  }
  
  private calculatePITWithBrackets(taxableIncome: number): { pitAmount: number, pitBrackets: PITBracket[] } {
    if (taxableIncome <= 0) {
      return { pitAmount: 0, pitBrackets: [] };
    }

    const pitBrackets: PITBracket[] = [];
    let pitAmount = 0;
    let previousLimit = 0;

    const taxTiers = [
        { level: 1, max: 5_000_000, rate: 0.05 },
        { level: 2, max: 10_000_000, rate: 0.10 },
        { level: 3, max: 18_000_000, rate: 0.15 },
        { level: 4, max: 32_000_000, rate: 0.20 },
        { level: 5, max: 52_000_000, rate: 0.25 },
        { level: 6, max: 80_000_000, rate: 0.30 },
        { level: 7, max: Infinity, rate: 0.35 },
    ];

    for (const tier of taxTiers) {
        if (taxableIncome > previousLimit) {
            const incomeInBracket = Math.min(taxableIncome, tier.max) - previousLimit;
            const taxInBracket = incomeInBracket * tier.rate;
            pitAmount += taxInBracket;

            pitBrackets.push({
                level: tier.level,
                incomeInBracket: incomeInBracket,
                rate: tier.rate,
                taxAmount: taxInBracket,
            });

            previousLimit = tier.max;
        } else {
            break;
        }
    }
    
    return { pitAmount, pitBrackets };
  }
}
export interface PayrollInput {
  netSalary: number;
  basicSalary: number;
  nonTaxableIncome: number;
  dependents: number;
}

export interface SIDetail {
  bhxh: number; // Social Insurance
  bhyt: number; // Health Insurance
  bhtn: number; // Unemployment Insurance
  total: number;
}

export interface PITBracket {
  level: number;
  incomeInBracket: number;
  rate: number;
  taxAmount: number;
}

export interface PITDetail {
  totalIncome: number; // Lương GROSS
  personalDeduction: number;
  dependentDeduction: number;
  siDeduction: number; // Khoản BHXH nhân viên đóng
  nonTaxableIncomeDeduction: number;
  taxableIncome: number;
  pitAmount: number; // The final PIT
  pitBrackets: PITBracket[];
}

export interface PayrollResult {
  // For Employee
  grossSalary: number;
  employeeSI: SIDetail;
  pit: PITDetail;
  netSalary: number;

  // For Company
  employerSI: SIDetail;
  totalCompanyCost: number;
  totalPaidToGovt: number;
  totalSIContribution: number;
}
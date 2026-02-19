import { useState, useMemo } from 'react'
import './App.css'
import { 
  Calculator, 
  TrendingUp, 
  Clock, 
  Users, 
  FileText, 
  BarChart3, 
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Waves,
  Briefcase,
  LayoutDashboard,
  PieChart
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// LKR to USD conversion rate (approximate)
const LKR_TO_USD = 0.0033

interface ROIParams {
  // General Parameters
  workingDaysPerWeek: number
  numberOfLines: number
  numberOfIEOfficers: number
  workingHoursPerWeekIE: number
  avgSalaryOfficer: number
  
  // Study App Parameters
  studiesNoteDownTime: number
  timeToEnterStudyTimes: number
  
  // Absentee Balancing Parameters
  replaceEmployeesFindingTime: number
  rebalanceTime: number
  employeesPerLine: number
  employeeWorkingHours: number
  employeeAvgSalary: number
  
  // Capacity Balancing Parameters
  studyDataAnalysisTime: number
  rebalancingTimeCapacity: number
  capacityBalancingTimesPerMonth: number
  
  // Reports Parameters
  reportQuantity: number
  reportDataAnalysisTime: number
  reportCreationTime: number
  
  // Investment Cost
  costOfInvestmentPerMonth: number
}

interface ROICalculations {
  // Study App
  studyAppTimeSavingPerLine: number
  studyAppLinesPerOfficer: number
  studyAppTimeSavingPerOfficer: number
  studyAppTotalTimeSavingPerDay: number
  studyAppTotalTimeSavingPerMonth: number
  studyAppTotalTimeSavingHoursPerMonth: number
  studyAppTotalWorkingHoursPerOfficer: number
  studyAppTotalWorkingHoursAllOfficers: number
  studyAppSavedTimePercentage: number
  studyAppTotalCostPerOfficer: number
  studyAppTotalCostAllOfficers: number
  studyAppTotalBenefit: number
  
  // Absentee Balancing
  absenteeRebalancingTimeSaving: number
  absenteeTotalTimeSavingPerLine: number
  absenteeTotalTimePerEmployee: number
  absenteeTotalTimePerLinePerDay: number
  absenteeTotalTimePerWeek: number
  absenteeTotalTimePerMonth: number
  absenteeTotalWorkingHoursPerLine: number
  absenteeSavingTimePercentage: number
  absenteeTotalLaborCostPerLine: number
  absenteeIESavingTimePerMonth: number
  absenteeIESavingPercentage: number
  absenteeIESavingCost: number
  absenteeEmployeeSavingCost: number
  absenteeTotalBenefit: number
  
  // Capacity Balancing
  capacityTimeSavingPerLinePerDay: number
  capacityTimeSavingAllLinesPerDay: number
  capacityTimeSavingAllLinesPerMonth: number
  capacitySavedTimePercentage: number
  capacityTotalBenefit: number
  
  // Reports
  reportsTimeSavingPerDay: number
  reportsTimeSavingPerMonth: number
  reportsSavedTimePercentage: number
  reportsTotalBenefit: number
  
  // Totals
  totalBenefits: number
  roi: number
  paybackPeriod: number
}

const defaultParams: ROIParams = {
  // General
  workingDaysPerWeek: 6,
  numberOfLines: 40,
  numberOfIEOfficers: 5,
  workingHoursPerWeekIE: 45,
  avgSalaryOfficer: 75000 * LKR_TO_USD, // Converted from LKR
  
  // Study App
  studiesNoteDownTime: 5,
  timeToEnterStudyTimes: 15,
  
  // Absentee Balancing
  replaceEmployeesFindingTime: 10,
  rebalanceTime: 15,
  employeesPerLine: 10,
  employeeWorkingHours: 50,
  employeeAvgSalary: 50000 * LKR_TO_USD, // Converted from LKR
  
  // Capacity Balancing
  studyDataAnalysisTime: 15,
  rebalancingTimeCapacity: 15,
  capacityBalancingTimesPerMonth: 5,
  
  // Reports
  reportQuantity: 5,
  reportDataAnalysisTime: 15,
  reportCreationTime: 10,
  
  // Investment
  costOfInvestmentPerMonth: 300000 * LKR_TO_USD, // Converted from LKR
}

function calculateROI(params: ROIParams): ROICalculations {
  // Study App Calculations
  const studyAppTimeSavingPerLine = params.studiesNoteDownTime + params.timeToEnterStudyTimes
  const studyAppLinesPerOfficer = params.numberOfLines / params.numberOfIEOfficers
  const studyAppTimeSavingPerOfficer = studyAppTimeSavingPerLine * studyAppLinesPerOfficer
  const studyAppTotalTimeSavingPerDay = studyAppTimeSavingPerOfficer * params.numberOfIEOfficers
  const studyAppTotalTimeSavingPerMonth = studyAppTotalTimeSavingPerDay * params.workingDaysPerWeek * 4
  const studyAppTotalTimeSavingHoursPerMonth = studyAppTotalTimeSavingPerMonth / 60
  const studyAppTotalWorkingHoursPerOfficer = params.workingHoursPerWeekIE * 4
  const studyAppTotalWorkingHoursAllOfficers = studyAppTotalWorkingHoursPerOfficer * params.numberOfIEOfficers
  const studyAppSavedTimePercentage = (studyAppTotalTimeSavingHoursPerMonth / studyAppTotalWorkingHoursAllOfficers) * 100
  const studyAppTotalCostPerOfficer = params.avgSalaryOfficer
  const studyAppTotalCostAllOfficers = studyAppTotalCostPerOfficer * params.numberOfIEOfficers
  const studyAppTotalBenefit = (studyAppTotalTimeSavingHoursPerMonth / studyAppTotalWorkingHoursAllOfficers) * studyAppTotalCostAllOfficers
  
  // Absentee Balancing Calculations
  const absenteeRebalancingTimeSaving = params.rebalanceTime - 5 // Assuming 5 min with app
  const absenteeTotalTimeSavingPerLine = params.replaceEmployeesFindingTime + absenteeRebalancingTimeSaving
  const absenteeTotalTimePerEmployee = absenteeTotalTimeSavingPerLine / 2
  const absenteeTotalTimePerLinePerDay = absenteeTotalTimePerEmployee * params.employeesPerLine
  const absenteeTotalTimePerWeek = absenteeTotalTimePerLinePerDay * params.workingDaysPerWeek
  const absenteeTotalTimePerMonth = (absenteeTotalTimePerWeek * 4) / 60
  const absenteeTotalWorkingHoursPerLine = params.employeeWorkingHours * params.employeesPerLine * 4
  const absenteeSavingTimePercentage = (absenteeTotalTimePerMonth / absenteeTotalWorkingHoursPerLine) * 100
  const absenteeTotalLaborCostPerLine = params.employeeAvgSalary * params.employeesPerLine
  const absenteeIESavingTimePerMonth = (params.numberOfLines * 10 * 4) / 60 // 10 min per line per week
  const absenteeIESavingPercentage = (absenteeIESavingTimePerMonth / studyAppTotalWorkingHoursPerOfficer) * 100
  const absenteeIESavingCost = (absenteeIESavingTimePerMonth / studyAppTotalWorkingHoursPerOfficer) * params.avgSalaryOfficer
  const absenteeEmployeeSavingCost = (absenteeTotalTimePerMonth / absenteeTotalWorkingHoursPerLine) * absenteeTotalLaborCostPerLine
  const absenteeTotalBenefit = absenteeIESavingCost + absenteeEmployeeSavingCost
  
  // Capacity Balancing Calculations
  const capacityTimeSavingPerLinePerDay = params.studyDataAnalysisTime + params.rebalancingTimeCapacity
  const capacityTimeSavingAllLinesPerDay = capacityTimeSavingPerLinePerDay * params.numberOfLines
  const capacityTimeSavingAllLinesPerMonth = (capacityTimeSavingAllLinesPerDay * params.workingDaysPerWeek * 4) / 60
  const capacitySavedTimePercentage = (capacityTimeSavingAllLinesPerMonth / studyAppTotalWorkingHoursAllOfficers) * 100
  const capacityTotalBenefit = (capacityTimeSavingAllLinesPerMonth / studyAppTotalWorkingHoursAllOfficers) * studyAppTotalCostAllOfficers
  
  // Reports Calculations
  const reportsTimeSavingPerDay = (params.reportDataAnalysisTime + params.reportCreationTime) * params.reportQuantity / 2
  const reportsTimeSavingPerMonth = (reportsTimeSavingPerDay * params.workingDaysPerWeek * 4) / 60
  const reportsSavedTimePercentage = (reportsTimeSavingPerMonth / studyAppTotalWorkingHoursPerOfficer) * 100
  const reportsTotalBenefit = (reportsTimeSavingPerMonth / studyAppTotalWorkingHoursPerOfficer) * params.avgSalaryOfficer * params.numberOfIEOfficers
  
  // Total Benefits and ROI
  const totalBenefits = studyAppTotalBenefit + absenteeTotalBenefit + capacityTotalBenefit + reportsTotalBenefit
  const roi = ((totalBenefits - params.costOfInvestmentPerMonth) / params.costOfInvestmentPerMonth) * 100
  const paybackPeriod = params.costOfInvestmentPerMonth / (totalBenefits / 30)
  
  return {
    studyAppTimeSavingPerLine,
    studyAppLinesPerOfficer,
    studyAppTimeSavingPerOfficer,
    studyAppTotalTimeSavingPerDay,
    studyAppTotalTimeSavingPerMonth,
    studyAppTotalTimeSavingHoursPerMonth,
    studyAppTotalWorkingHoursPerOfficer,
    studyAppTotalWorkingHoursAllOfficers,
    studyAppSavedTimePercentage,
    studyAppTotalCostPerOfficer,
    studyAppTotalCostAllOfficers,
    studyAppTotalBenefit,
    absenteeRebalancingTimeSaving,
    absenteeTotalTimeSavingPerLine,
    absenteeTotalTimePerEmployee,
    absenteeTotalTimePerLinePerDay,
    absenteeTotalTimePerWeek,
    absenteeTotalTimePerMonth,
    absenteeTotalWorkingHoursPerLine,
    absenteeSavingTimePercentage,
    absenteeTotalLaborCostPerLine,
    absenteeIESavingTimePerMonth,
    absenteeIESavingPercentage,
    absenteeIESavingCost,
    absenteeEmployeeSavingCost,
    absenteeTotalBenefit,
    capacityTimeSavingPerLinePerDay,
    capacityTimeSavingAllLinesPerDay,
    capacityTimeSavingAllLinesPerMonth,
    capacitySavedTimePercentage,
    capacityTotalBenefit,
    reportsTimeSavingPerDay,
    reportsTimeSavingPerMonth,
    reportsSavedTimePercentage,
    reportsTotalBenefit,
    totalBenefits,
    roi,
    paybackPeriod,
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 bg-gradient-kingslake rounded-lg transform rotate-3"></div>
        <div className="absolute inset-0 bg-gradient-kingslake rounded-lg flex items-center justify-center">
          <Waves className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-gradient">KingsLakeBlue</span>
        <span className="text-xs text-muted-foreground -mt-1">Intelligent Solutions</span>
      </div>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-kingslake-50 via-white to-kingslake-100"></div>
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-kingslake-300 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-kingslake-400 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-kingslake-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <Badge className="mb-4 bg-kingslake-100 text-kingslake-700 hover:bg-kingslake-200 border-kingslake-200">
          <Calculator className="w-3 h-3 mr-1" />
          ROI Analysis Tool
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          <span className="text-gradient">Transform Your</span>
          <br />
          <span className="text-foreground">Production Efficiency</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Calculate the return on investment for KingsLakeBlue's intelligent production management solutions. 
          See how much time and money you can save across Study Management, Absentee Balancing, 
          Capacity Planning, and Automated Reporting.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-kingslake-500" />
            <span>Real-time Calculations</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-kingslake-500" />
            <span>Customizable Parameters</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-kingslake-500" />
            <span>Detailed Analytics</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function InputField({ 
  label, 
  value, 
  onChange, 
  unit = '', 
  type = 'number',
  min = 0,
  step = 1,
  icon: Icon
}: { 
  label: string
  value: number
  onChange: (value: number) => void
  unit?: string
  type?: string
  min?: number
  step?: number
  icon?: React.ElementType
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-kingslake-500" />}
        {label}
      </Label>
      <div className="relative">
        <Input
          type={type}
          value={type === 'number' ? value : value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          step={step}
          className="input-kingslake pr-12"
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

function ResultCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon,
  trend,
  color = 'blue'
}: { 
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  trend?: string
  color?: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'from-kingslake-500 to-kingslake-400',
    green: 'from-emerald-500 to-emerald-400',
    purple: 'from-violet-500 to-violet-400',
    orange: 'from-orange-500 to-orange-400',
  }
  
  return (
    <Card className="card-hover overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">{trend}</span>
              </div>
            )}
          </div>
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ROICalculator() {
  const [params, setParams] = useState<ROIParams>(defaultParams)
  const [activeTab, setActiveTab] = useState('general')
  
  const calculations = useMemo(() => calculateROI(params), [params])
  
  const updateParam = (key: keyof ROIParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }
  
  const resetToDefaults = () => {
    setParams(defaultParams)
  }
  
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">ROI Calculator</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Adjust the parameters below to match your production environment and see the potential savings.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-kingslake-500" />
                    Parameters
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={resetToDefaults}>
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="modules">Modules</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="general" className="space-y-4">
                    <InputField
                      label="Working Days per Week"
                      value={params.workingDaysPerWeek}
                      onChange={(v) => updateParam('workingDaysPerWeek', v)}
                      unit="days"
                      icon={Clock}
                    />
                    <InputField
                      label="Number of Production Lines"
                      value={params.numberOfLines}
                      onChange={(v) => updateParam('numberOfLines', v)}
                      unit="lines"
                      icon={LayoutDashboard}
                    />
                    <InputField
                      label="Number of IE Officers"
                      value={params.numberOfIEOfficers}
                      onChange={(v) => updateParam('numberOfIEOfficers', v)}
                      unit="officers"
                      icon={Users}
                    />
                    <InputField
                      label="IE Officer Working Hours/Week"
                      value={params.workingHoursPerWeekIE}
                      onChange={(v) => updateParam('workingHoursPerWeekIE', v)}
                      unit="hours"
                      icon={Clock}
                    />
                    <InputField
                      label="Avg. IE Officer Salary"
                      value={params.avgSalaryOfficer}
                      onChange={(v) => updateParam('avgSalaryOfficer', v)}
                      unit="$/mo"
                      icon={DollarSign}
                      step={10}
                    />
                    <InputField
                      label="Investment Cost per Month"
                      value={params.costOfInvestmentPerMonth}
                      onChange={(v) => updateParam('costOfInvestmentPerMonth', v)}
                      unit="$/mo"
                      icon={DollarSign}
                      step={10}
                    />
                  </TabsContent>
                  
                  <TabsContent value="modules" className="space-y-4">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Study App
                      </p>
                      <InputField
                        label="Studies Note Down Time"
                        value={params.studiesNoteDownTime}
                        onChange={(v) => updateParam('studiesNoteDownTime', v)}
                        unit="min"
                      />
                      <InputField
                        label="Time to Enter Study Data"
                        value={params.timeToEnterStudyTimes}
                        onChange={(v) => updateParam('timeToEnterStudyTimes', v)}
                        unit="min"
                      />
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Absentee Balancing
                      </p>
                      <InputField
                        label="Find Replacement Time"
                        value={params.replaceEmployeesFindingTime}
                        onChange={(v) => updateParam('replaceEmployeesFindingTime', v)}
                        unit="min"
                      />
                      <InputField
                        label="Rebalance Time"
                        value={params.rebalanceTime}
                        onChange={(v) => updateParam('rebalanceTime', v)}
                        unit="min"
                      />
                      <InputField
                        label="Employees per Line"
                        value={params.employeesPerLine}
                        onChange={(v) => updateParam('employeesPerLine', v)}
                        unit="employees"
                      />
                      <InputField
                        label="Employee Working Hours/Week"
                        value={params.employeeWorkingHours}
                        onChange={(v) => updateParam('employeeWorkingHours', v)}
                        unit="hours"
                      />
                      <InputField
                        label="Employee Avg. Salary"
                        value={params.employeeAvgSalary}
                        onChange={(v) => updateParam('employeeAvgSalary', v)}
                        unit="$/mo"
                        step={10}
                      />
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Capacity Balancing
                      </p>
                      <InputField
                        label="Study Data Analysis Time"
                        value={params.studyDataAnalysisTime}
                        onChange={(v) => updateParam('studyDataAnalysisTime', v)}
                        unit="min"
                      />
                      <InputField
                        label="Rebalancing Time"
                        value={params.rebalancingTimeCapacity}
                        onChange={(v) => updateParam('rebalancingTimeCapacity', v)}
                        unit="min"
                      />
                      <InputField
                        label="Balancing Times per Month"
                        value={params.capacityBalancingTimesPerMonth}
                        onChange={(v) => updateParam('capacityBalancingTimesPerMonth', v)}
                        unit="times"
                      />
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-kingslake-600 flex items-center gap-2">
                        <PieChart className="w-4 h-4" />
                        Reports
                      </p>
                      <InputField
                        label="Daily Report Quantity"
                        value={params.reportQuantity}
                        onChange={(v) => updateParam('reportQuantity', v)}
                        unit="reports"
                      />
                      <InputField
                        label="Report Data Analysis Time"
                        value={params.reportDataAnalysisTime}
                        onChange={(v) => updateParam('reportDataAnalysisTime', v)}
                        unit="min"
                      />
                      <InputField
                        label="Report Creation Time"
                        value={params.reportCreationTime}
                        onChange={(v) => updateParam('reportCreationTime', v)}
                        unit="min"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ResultCard
                title="Total Monthly Benefit"
                value={formatCurrency(calculations.totalBenefits)}
                subtitle="Across all modules"
                icon={DollarSign}
                color="green"
              />
              <ResultCard
                title="ROI"
                value={`${formatNumber(calculations.roi, 0)}%`}
                subtitle="Return on Investment"
                icon={TrendingUp}
                trend="Excellent"
                color="blue"
              />
              <ResultCard
                title="Payback Period"
                value={`${formatNumber(calculations.paybackPeriod, 0)} days`}
                subtitle="Time to recover investment"
                icon={Clock}
                color="purple"
              />
              <ResultCard
                title="Monthly Investment"
                value={formatCurrency(params.costOfInvestmentPerMonth)}
                subtitle="KingsLakeBlue solution cost"
                icon={Briefcase}
                color="orange"
              />
            </div>
            
            {/* Module Breakdown */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Study App */}
              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-kingslake-500 to-kingslake-400 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    Study App
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Time Saved/Month</span>
                    <span className="font-semibold">{formatNumber(calculations.studyAppTotalTimeSavingHoursPerMonth, 0)} hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Efficiency Gain</span>
                    <span className="font-semibold text-kingslake-600">{formatNumber(calculations.studyAppSavedTimePercentage, 1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Monthly Benefit</span>
                    <span className="font-semibold text-emerald-600">{formatCurrency(calculations.studyAppTotalBenefit)}</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Absentee Balancing */}
              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    Absentee Balancing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Time Saved/Month</span>
                    <span className="font-semibold">{formatNumber(calculations.absenteeTotalTimePerMonth, 0)} hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Labor Efficiency</span>
                    <span className="font-semibold text-violet-600">{formatNumber(calculations.absenteeSavingTimePercentage, 1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Monthly Benefit</span>
                    <span className="font-semibold text-emerald-600">{formatCurrency(calculations.absenteeTotalBenefit)}</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Capacity Balancing */}
              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    Capacity Balancing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Time Saved/Month</span>
                    <span className="font-semibold">{formatNumber(calculations.capacityTimeSavingAllLinesPerMonth, 0)} hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">IE Time Saved</span>
                    <span className="font-semibold text-orange-600">{formatNumber(calculations.capacitySavedTimePercentage, 1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Monthly Benefit</span>
                    <span className="font-semibold text-emerald-600">{formatCurrency(calculations.capacityTotalBenefit)}</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Reports */}
              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-400 flex items-center justify-center">
                      <PieChart className="w-4 h-4 text-white" />
                    </div>
                    Automated Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Time Saved/Month</span>
                    <span className="font-semibold">{formatNumber(calculations.reportsTimeSavingPerMonth, 0)} hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Report Efficiency</span>
                    <span className="font-semibold text-emerald-600">{formatNumber(calculations.reportsSavedTimePercentage, 1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Monthly Benefit</span>
                    <span className="font-semibold text-emerald-600">{formatCurrency(calculations.reportsTotalBenefit)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Total Benefits Breakdown */}
            <Card className="bg-gradient-to-br from-kingslake-900 to-kingslake-800 text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Monthly Benefits Breakdown
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-kingslake-400"></div>
                      <span className="text-kingslake-100">Study App</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(calculations.studyAppTotalBenefit)}</span>
                  </div>
                  <div className="w-full bg-kingslake-700/50 rounded-full h-2">
                    <div 
                      className="bg-kingslake-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(calculations.studyAppTotalBenefit / calculations.totalBenefits) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-violet-400"></div>
                      <span className="text-kingslake-100">Absentee Balancing</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(calculations.absenteeTotalBenefit)}</span>
                  </div>
                  <div className="w-full bg-kingslake-700/50 rounded-full h-2">
                    <div 
                      className="bg-violet-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(calculations.absenteeTotalBenefit / calculations.totalBenefits) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                      <span className="text-kingslake-100">Capacity Balancing</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(calculations.capacityTotalBenefit)}</span>
                  </div>
                  <div className="w-full bg-kingslake-700/50 rounded-full h-2">
                    <div 
                      className="bg-orange-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(calculations.capacityTotalBenefit / calculations.totalBenefits) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                      <span className="text-kingslake-100">Automated Reports</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(calculations.reportsTotalBenefit)}</span>
                  </div>
                  <div className="w-full bg-kingslake-700/50 rounded-full h-2">
                    <div 
                      className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(calculations.reportsTotalBenefit / calculations.totalBenefits) * 100}%` }}
                    ></div>
                  </div>
                  
                  <Separator className="bg-kingslake-600 my-4" />
                  
                  <div className="flex items-center justify-between text-lg">
                    <span className="text-kingslake-200">Total Monthly Benefits</span>
                    <span className="font-bold text-2xl">{formatCurrency(calculations.totalBenefits)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: FileText,
      title: 'Study Management',
      description: 'Digitize time studies and eliminate manual data entry. Capture study data directly on the production floor.',
      color: 'from-kingslake-500 to-kingslake-400'
    },
    {
      icon: Users,
      title: 'Absentee Balancing',
      description: 'Quickly find replacements and rebalance lines when employees are absent. Minimize production disruptions.',
      color: 'from-violet-500 to-violet-400'
    },
    {
      icon: BarChart3,
      title: 'Capacity Balancing',
      description: 'Optimize production line capacity with intelligent analysis and automated rebalancing recommendations.',
      color: 'from-orange-500 to-orange-400'
    },
    {
      icon: PieChart,
      title: 'Automated Reports',
      description: 'Generate comprehensive production reports automatically. Save hours of manual analysis and compilation.',
      color: 'from-emerald-500 to-emerald-400'
    }
  ]
  
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-kingslake-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">KingsLakeBlue Solutions</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our comprehensive suite of production management tools designed to maximize efficiency and minimize waste.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="card-hover group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-kingslake-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-12 px-4 bg-kingslake-950 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-kingslake rounded-lg flex items-center justify-center">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold">KingsLakeBlue</span>
              <p className="text-xs text-kingslake-300">Intelligent Production Solutions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-kingslake-300">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Features</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
          
          <p className="text-sm text-kingslake-400">
            © 2026 KingsLakeBlue. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-kingslake-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Logo />
        </div>
      </header>
      
      <main>
        <HeroSection />
        <ROICalculator />
        <FeaturesSection />
      </main>
      
      <Footer />
    </div>
  )
}

export default App

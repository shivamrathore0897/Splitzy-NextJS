"use client";

import {useState, useRef, useEffect} from 'react';
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {
  User,
  Wallet,
  History,
  CheckCircle,
  AlertTriangle,
  Edit,
  IndianRupee,
  Euro,
  DollarSign,
  PoundSterling,
  Sun,
  Moon,
} from 'lucide-react';
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert"
import {cn} from "@/lib/utils";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {toast} from "@/hooks/use-toast";
import {v4 as uuidv4} from 'uuid';
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useTheme} from 'next-themes';
import {useEffect as useReactEffect} from 'react';

// Component for displaying a participant item in the list
const ParticipantItem = ({index, participant, isPayer}: any) => (
  <li key={index} className="flex items-center space-x-2 py-1">
    {isPayer ? (
      <CheckCircle className="mr-1 h-4 w-4 text-green-500"/>
    ) : (
      <User className="mr-1 h-4 w-4 text-gray-500"/>
    )}
    <span className="text-gray-700">{index + 1}. {participant}</span>
  </li>
);


export default function Home() {
  const {theme, setTheme} = useTheme();

  const [billAmount, setBillAmount] = useState<number | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantName, setParticipantName] = useState("");
  const [owedAmounts, setOwedAmounts] = useState<{ [name: string]: number }>({});
  const [individualOwedAmounts, setIndividualOwedAmounts] = useState<{ [payer: string]: { [owee: string]: number } }>({});

  const [payer, setPayer] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");
  const [isCalculating, setIsCalculating] = useState(false);
  const [expenseType, setExpenseType] = useState<string>("Food/Meal"); // Default expense type
  const [expenseTypes, setExpenseTypes] = useState<string[]>(["Food/Meal", "Shopping", "Travel"]); // Initial expense types
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isEditingExpenseType, setIsEditingExpenseType] = useState(false);
  const [newExpenseType, setNewExpenseType] = useState("");
  const [activeTab, setActiveTab] = useState("expenseDetails");

  // Error states
  const [billAmountError, setBillAmountError] = useState<string | null>(null);
  const [participantNameError, setParticipantNameError] = useState<string | null>(null);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [payerError, setPayerError] = useState<string | null>(null);
  const [currencyError, setCurrencyError] = useState<string | null>(null);

  // Validation function to check if the form is valid
  const isFormValid = () => {
    let isValid = true;

    // Participants Validation
    if (participants.length === 0) {
      setParticipantsError("Please add at least one participant.");
      isValid = false;
    } else {
      setParticipantsError(null);
    }
    if (!payer) {
      setPayerError("Please select payer.")
      isValid = false;
    } else {
      setPayerError(null);
    }

    if (!currency) {
      setCurrencyError("Please select currency.")
      isValid = false;
    } else {
      setPayerError(null);
    }

    return isValid;
  };


  // Handler for adding a new participant to the list
  const handleAddParticipant = () => {
    if (participantName.trim() === "") {
      setParticipantNameError("Participant name cannot be empty.");
      return;
    } else {
      setParticipantNameError(null);
    }

    setParticipants([...participants, participantName.trim()]);
    setParticipantName("");
  };

  // Handler for calculating the split amount
  const handleCalculateSplit = () => {
    // Reset error states
    setBillAmountError(null);
    setParticipantsError(null);
    setPayerError(null);
    setCurrencyError(null);

    let isValid = true;

    // Validate bill amount
    if (billAmount === null || billAmount <= 0) {
      setBillAmountError("Bill amount must be greater than 0.");
      isValid = false;
    }

    // Validate form fields
    if (!isFormValid()) {
      return;
    }

    // If form is invalid, return
    if (!isValid) {
      return;
    }

    setIsCalculating(true);
    try {
      // Calculate split amount
      const splitAmount = billAmount! / participants.length;
      const newOwedAmounts: { [name: string]: number } = {};
      const newIndividualOwedAmounts: { [payer: string]: { [owee: string]: number } } = {};

      // Calculate owed amounts for each participant
      participants.forEach((participant) => {
        if (payer === participant) {
          newOwedAmounts[participant] = 0; // Payer already paid
        } else {
          newOwedAmounts[participant] = splitAmount;
          if (!newIndividualOwedAmounts[payer]) {
            newIndividualOwedAmounts[payer] = {};
          }
          newIndividualOwedAmounts[payer][participant] = splitAmount;
        }
      });

      // Update owed amounts state
      setOwedAmounts(newOwedAmounts);
      // Consolidate individual owed amounts
      setIndividualOwedAmounts(prevIndividualOwedAmounts => {
        const updatedIndividualOwedAmounts = {...prevIndividualOwedAmounts};

        if (!updatedIndividualOwedAmounts[payer]) {
          updatedIndividualOwedAmounts[payer] = {};
        }

        participants.forEach(participant => {
          if (payer !== participant) {
            updatedIndividualOwedAmounts[payer][participant] = splitAmount;
          }
        });

        return updatedIndividualOwedAmounts;
      });
      setExpenses([...expenses, {
        type: expenseType,
        amount: billAmount,
        participants: participants,
        payer: payer,
        currency: currency,
        owedAmounts: newOwedAmounts,
      }])
    } finally {
      setIsCalculating(false);
    }
  };

  // Check if calculation is disabled
  const isCalculateDisabled = !billAmount || !payer || !currency;

  const currencySymbols: any = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
  };

  const currencySymbol = currencySymbols[currency] || "$";

  const handleAddExpenseType = () => {
    setIsEditingExpenseType(true);
  };

  const handleSaveExpenseType = () => {
    if (newExpenseType && newExpenseType.trim() !== "" && !expenseTypes.includes(newExpenseType.trim())) {
      setExpenseTypes(prevTypes => [...new Set([...prevTypes, newExpenseType.trim()])]);
    }
    setIsEditingExpenseType(false);
    setNewExpenseType("");
  };


  const totalOwedAmounts = () => {
    let totalOwed: { [name: string]: number } = {};
    expenses.forEach(expense => {
      Object.entries(expense.owedAmounts).forEach(([name, amount]) => {
        totalOwed[name] = (totalOwed[name] || 0) + amount;
      });
    });
    return totalOwed;
  }

  const calculateNetOwedAmounts = () => {
    let netOwed: { [name: string]: number } = {};

    expenses.forEach(expense => {
      Object.entries(expense.owedAmounts).forEach(([owee, amount]) => {
        if (!netOwed[owee]) {
          netOwed[owee] = 0;
        }

        // Adjust the net owed amount based on the payer
        if (expense.payer !== owee) {
          netOwed[owee] += amount; // Owee receives
        }
      });

      // Deduct the total paid amount from the payer's balance
      if (!netOwed[expense.payer]) {
        netOwed[expense.payer] = 0;
      }
      netOwed[expense.payer] -= expense.amount / expense.participants.length * (expense.participants.length - 1);
    });

    return netOwed;
  };

  const calculateSimplifiedOwedAmounts = () => {
    const netOwed = calculateNetOwedAmounts();
    const simplifiedOwed: { from: string; to: string; amount: number }[] = [];

    // Sort participants based on their net owed amounts (highest owed first)
    const sortedParticipants = Object.entries(netOwed)
      .sort(([, amountA], [, amountB]) => amountB - amountA)
      .map(([name]) => name);

    let balances = {...netOwed}; // Copy of netOwed to manipulate balances

    for (let i = 0; i < sortedParticipants.length; i++) {
      const debtor = sortedParticipants[i];
      if (balances[debtor] <= 0) continue; // Skip if debtor has no debt

      for (let j = i + 1; j < sortedParticipants.length; j++) {
        const creditor = sortedParticipants[j];
        if (balances[creditor] >= 0) continue; // Skip if creditor is not owed

        const transactionAmount = Math.min(balances[debtor], -balances[creditor]);

        simplifiedOwed.push({
          from: creditor,
          to: debtor,
          amount: transactionAmount,
        });

        balances[debtor] -= transactionAmount;
        balances[creditor] += transactionAmount;

        if (balances[debtor] === 0) break; // Debtor's debt is settled
      }
    }

    return simplifiedOwed;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-4 bg-gradient-to-br from-green-100 to-teal-50 font-sans">
      <Button variant="outline" size="icon" className="absolute top-4 right-4 z-10" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        {theme === 'light' ? <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"/> :
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>}
        <span className="sr-only">Toggle theme</span>
      </Button>
      <Card className="w-full max-w-md space-y-6 p-6 rounded-xl shadow-md bg-white/80 backdrop-blur-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold text-center text-gray-800">
            Splitzy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="expenseDetails">Expense Details</TabsTrigger>
              <TabsTrigger value="owedBreakdown">Owed Breakdown</TabsTrigger>
            </TabsList>
            <TabsContent value="expenseDetails" className="space-y-6">

              {/* Expense Details Section */}
              <section className="space-y-4">
                <Label htmlFor="expenseType" className="text-gray-700 font-medium">
                  Expense Details
                </Label>
                <div className="flex items-center space-x-2">
                  <Select onValueChange={setExpenseType} value={expenseType}>
                    <SelectTrigger className="w-48 rounded-md">
                      <SelectValue placeholder={expenseType}/>
                    </SelectTrigger>
                    <SelectContent>
                      {expenseTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleAddExpenseType}
                    className="h-9 w-9"
                  >
                    <Edit className="h-4 w-4"/>
                    <span className="sr-only">Edit Expense Types</span>
                  </Button>
                </div>
                {isEditingExpenseType && (
                  <div className="flex flex-col space-y-2 mt-2">
                    <Input
                      type="text"
                      placeholder="Enter new expense type"
                      className="rounded-md text-gray-700 shadow-sm"
                      value={newExpenseType}
                      onChange={(e) => setNewExpenseType(e.target.value)}
                    />
                    <Button onClick={handleSaveExpenseType} className="bg-teal-500 text-white hover:bg-teal-600 rounded-md shadow-md">
                      Save
                    </Button>
                  </div>
                )}
              </section>

              {/* Bill Amount Section */}
              <section className="space-y-4">
                <Label htmlFor="billAmount" className="text-gray-700 font-medium">
                  Bill Amount
                </Label>
                <div className="flex ">

                  {/* Currency Selection Section */}

                  <Select onValueChange={setCurrency} value={currency}>
                    <SelectTrigger className="w-[80px] rounded-r-none">
                      {/* Manually render selected currency symbol */}
                      <span className="pl-2">{currencySymbols[currency]}</span>
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="USD">USD - $</SelectItem>
                      <SelectItem value="EUR">EUR - €</SelectItem>
                      <SelectItem value="GBP">GBP - £</SelectItem>
                      <SelectItem value="INR">INR - ₹</SelectItem>
                      <SelectItem value="JPY">JPY - ¥</SelectItem>
                      <SelectItem value="CAD">CAD - C$</SelectItem>
                      <SelectItem value="AUD">AUD - A$</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    id="billAmount"
                    type="number"
                    placeholder="Enter bill amount"
                    className="rounded-l-none text-gray-700 shadow-sm"
                    value={billAmount === null ? "" : billAmount.toString()}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setBillAmount(isNaN(value) ? null : value);
                    }}
                  />
                </div>
                {billAmountError && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{billAmountError}</AlertDescription>
                  </Alert>
                )}
              </section>

              {/* Participants Section */}
              <section className="space-y-4">
                <Label htmlFor="participantName" className="text-gray-700 font-medium">
                  Participants
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="participantName"
                    type="text"
                    placeholder="Enter participant name"
                    className="rounded-md text-gray-700 shadow-sm"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                  />
                  <Button onClick={handleAddParticipant} className="bg-teal-500 text-white hover:bg-teal-600 rounded-md shadow-md">
                    <User className="mr-2 h-4 w-4"/>
                    Add
                  </Button>
                </div>
                {participantNameError && (
                  <Alert variant="destructive" className="animate-shake">
                    <AlertTitle>
                      <AlertTriangle className="h-4 w-4 mr-2"/>
                      Error
                    </AlertTitle>
                    <AlertDescription>{participantNameError}</AlertDescription>
                  </Alert>
                )}
                {participants.length > 0 && (
                  <div className="mt-2">
                    <Label className="text-gray-700 font-medium">List of Participants:</Label>
                    <ul>
                      {participants.map((participant, index) => (
                        <ParticipantItem
                          key={index}
                          index={index}
                          participant={participant}
                          isPayer={payer === participant}
                        />
                      ))}
                    </ul>
                  </div>
                )}
                {participantsError && (
                  <Alert variant="destructive">
                    <AlertTitle>
                      <AlertTriangle className="h-4 w-4 mr-2"/>
                      Error
                    </AlertTitle>
                    <AlertDescription>{participantsError}</AlertDescription>
                  </Alert>
                )}
              </section>

              {/* Payer Selection Section */}
              <section className="space-y-4">
                <Label className="text-gray-700 font-medium">Who Paid?</Label>
                <select
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm"
                  onChange={(e) => setPayer(e.target.value)}
                  value={payer}
                >
                  <option value="">Select Payer</option>
                  {participants.map((participant, index) => (
                    <option key={index} value={participant}>
                      {participant}
                    </option>
                  ))}
                </select>
                {payerError && (
                  <Alert variant="destructive">
                    <AlertTitle>
                      <AlertTriangle className="h-4 w-4 mr-2"/>
                      Error
                    </AlertTitle>
                    <AlertDescription>{payerError}</AlertDescription>
                  </Alert>
                )}
              </section>


              {/* Calculate Split Button */}
              <Button
                className={cn(
                  "w-full bg-teal-500 text-white hover:bg-teal-600 rounded-md shadow-md transition-colors duration-300",
                  isCalculateDisabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={handleCalculateSplit}
                disabled={isCalculating || isCalculateDisabled}
              >
                <Wallet className="mr-2 h-4 w-4"/>
                Calculate Split
              </Button>
            </TabsContent>
            <TabsContent value="owedBreakdown" className="space-y-6">
              <section className="mt-6 space-y-4">
                <Label className="text-gray-700 font-medium">Simplified Owed Amounts:</Label>
                <ul>
                  {calculateSimplifiedOwedAmounts().map((transaction, index) => (
                    <li key={index} className="flex items-center justify-between py-2 border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <User className="mr-1 h-4 w-4 text-gray-500"/>
                        <span className="text-gray-800">{transaction.from}</span>
                        <span className="text-gray-500">owes</span>
                        <User className="mr-1 h-4 w-4 text-gray-500"/>
                        <span className="text-gray-800">{transaction.to}</span>
                      </div>
                      <span className="text-gray-700">{currencySymbol}{transaction.amount.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>


      {expenses.map((expense, index) => (
        <Card key={index} className="w-full max-w-md space-y-6 p-6 rounded-xl shadow-md bg-white/80 backdrop-blur-sm border border-gray-200 mt-4">
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-center text-gray-800">
              Expense Details of : {expense.type}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Owed Amounts Display Section */}
            {Object.keys(expense.owedAmounts).length > 0 && (
              <section className="mt-6 space-y-4">
                <Label className="text-gray-700 font-medium">Owed Amounts:</Label>
                <ul>
                  {Object.entries(expense.owedAmounts).map(([name, amount]) => (
                    <li key={name} className="flex items-center justify-between py-2 border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        {expense.payer === name ? (
                          <>
                            <CheckCircle className="mr-1 h-4 w-4 text-green-500"/>
                            <span className="font-semibold text-gray-800">{name} (Payer)</span>
                          </>
                        ) : (
                          <>
                            <User className="mr-1 h-4 w-4 text-gray-500"/>
                            <span className="text-gray-800">{name}</span>
                          </>
                        )}
                      </div>
                      <span className="text-gray-700">{currencySymbols[expense.currency]}{amount.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <Label className="text-gray-700 font-medium">Total Amount Paid:</Label>
            <span className="text-gray-700">{currencySymbols[expense.currency]}{expense.amount.toFixed(2)}</span>
          </CardContent>
        </Card>
      ))}

      <Card className="w-full max-w-md space-y-6 p-6 rounded-xl shadow-md bg-white/80 backdrop-blur-sm border border-gray-200 mt-4">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold text-center text-gray-800">
            Total Owed Amounts:
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Owed Amounts Display Section */}
          {Object.keys(totalOwedAmounts()).length > 0 && (
            <section className="mt-6 space-y-4">
              <Label className="text-gray-700 font-medium">Total Owed Amounts:</Label>
              <ul>
                {Object.entries(totalOwedAmounts()).map(([name, amount]) => (
                  <li key={name} className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <User className="mr-1 h-4 w-4 text-gray-500"/>
                      <span className="text-gray-800">{name}</span>
                    </div>
                    <span className="text-gray-700">{currencySymbol}{amount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </CardContent>
      </Card>


      <footer className="mt-8 text-center text-gray-500">
        <p>
          Made with ❤️ just for you
        </p>
      </footer>
    </div>
  );
}

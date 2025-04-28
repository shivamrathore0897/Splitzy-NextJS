"use client";

import { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
  Trash2,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from 'next-themes';
import { useEffect as useReactEffect } from 'react';
import { storage } from '../utils/storage'; // adjust the path as needed



// Component for displaying a participant item in the list
const ParticipantItem = ({ index, participant, isPayer }: any) => (
  <li key={index} className="flex items-center space-x-2 py-1">
    {isPayer ? (
      <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
    ) : (
      <User className="mr-1 h-4 w-4 text-foreground" />
    )}
    <span className="text-foreground/50">{index + 1}. {participant}</span>
  </li>
);


export default function Home() {
  const { theme: initialTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false); // Track if component has mounted

  // Wait for the component to mount before accessing the theme to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Safely access the theme after the component has mounted
  const theme = mounted ? initialTheme : "light";

  const [billAmount, setBillAmount] = useState<number | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantName, setParticipantName] = useState("");
  const [owedAmounts, setOwedAmounts] = useState<{ [name: string]: number }>({});
  const [individualOwedAmounts, setIndividualOwedAmounts] = useState<{ [payer: string]: { [owee: string]: number } }>({});

  const [payer, setPayer] = useState<string>("");
  const [currency, setCurrency] = useState<string>("INR");
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

  const currencySymbols: any = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    JPY: "¥",
    CAD: "C$",
    AUD: "A$",
  };


  // Load expenses from storage on component mount
  useEffect(() => {
    const loadExpenses = async () => {
      const storedExpenses = await storage.get('expenses');
      if (storedExpenses) {
        setExpenses(storedExpenses as any[]);
        // Extract participants from stored expenses
        const allParticipants = new Set<string>();
        storedExpenses.forEach((expense: any) => {
          expense.participants.forEach((participant: string) => {
            allParticipants.add(participant);
          });
        });
        setParticipants(Array.from(allParticipants));
      }
    };

    loadExpenses();
  }, []);

  // Save expenses to storage whenever the expenses state changes
  useEffect(() => {
    storage.set('expenses', expenses);
  }, [expenses]);


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
        const updatedIndividualOwedAmounts = { ...prevIndividualOwedAmounts };

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
      setExpenses([{
        type: expenseType,
        amount: billAmount,
        participants: participants,
        payer: payer,
        currency: currency,
        owedAmounts: newOwedAmounts,
      }, ...expenses,])
    } finally {
      setIsCalculating(false);
    }
  };

  // Check if calculation is disabled
  const isCalculateDisabled = !billAmount || !payer || !currency;



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

  const handleDeleteExpense = async (indexToDelete: number) => {
    const updatedExpenses = expenses.filter((_, index) => index !== indexToDelete);
    setExpenses(updatedExpenses);
    await storage.set('expenses', updatedExpenses);
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
        netOwed[owee] += amount; // Owee receives
        if (!netOwed[expense.payer]) {
          netOwed[expense.payer] = 0;
        }
        netOwed[expense.payer] -= amount; // Payer pays
      });
    });

    return netOwed;
  };

  const calculateSimplifiedOwedAmounts = () => {
    const netOwed = calculateNetOwedAmounts();
    const simplifiedOwed: { from: string; to: string; amount: number; currency: string }[] = [];

    const sortedParticipants = Object.entries(netOwed)
      .sort(([, amountA], [, amountB]) => amountB - amountA)
      .map(([name]) => name);

    let balances = { ...netOwed };
    let transactionCurrency = "USD";
    for (let i = 0; i < sortedParticipants.length; i++) {
      const creditor = sortedParticipants[i];
      if (balances[creditor] <= 0) continue;

      for (let j = i + 1; j < sortedParticipants.length; j++) {
        const debtor = sortedParticipants[j];
        if (balances[debtor] >= 0) continue;

        const transactionAmount = Math.min(balances[creditor], -balances[debtor]);
        const relevantExpense = expenses.find(expense =>
          expense.owedAmounts[debtor] != null && expense.owedAmounts[creditor] != null
        );
        // Default to USD if no currency is found
        // const transactionCurrency = relevantExpense ? relevantExpense.currency : "USD"; 

        transactionCurrency = relevantExpense?.currency || transactionCurrency;

        simplifiedOwed.push({
          from: debtor,
          to: creditor,
          amount: transactionAmount,
          currency: transactionCurrency,
        });

        balances[creditor] -= transactionAmount;
        balances[debtor] += transactionAmount;

        if (balances[creditor] === 0) break;
      }
    }

    return simplifiedOwed;
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-4 bg-gradient-to-br from-green-100 to-teal-50 font-sans">
      <Card className="w-full max-w-md space-y-6 p-6 rounded-xl shadow-md bg-white/80 backdrop-blur-sm border border-gray-200 dark:bg-gray-800/80 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold text-center text-foreground">
            Splitzy
          </CardTitle>
          <Button variant="outline" size="icon" className="absolute top-4 right-4 z-10 inline-flex items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {/* Conditionally render the icon based on the current theme */}
            {theme === 'light' ? (
              <Moon className="h-[1.2rem] w-[1.2rem] text-gray-900 dark:text-gray-100 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            ) : (
              <Sun color="white" className="h-[1.2rem] w-[1.2rem] text-gray-900 light:text-gray-100 rotate-0 scale-100 transition-all light:-rotate-90 light:scale-0" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="expenseDetails">Expense Details</TabsTrigger>
              <TabsTrigger value="owedBreakdown">Owed Breakdown</TabsTrigger>
            </TabsList>
            <TabsContent value="expenseDetails" className="space-y-6">

              {/* Expense Details Section */}
              <section className="space-y-2">
                <Label htmlFor="expenseType" className="text-foreground/50 font-medium">
                  Expense Details
                </Label>
                <div className="flex items-center space-x-2 space-y-1">
                  <Select onValueChange={setExpenseType} value={expenseType}>
                    <SelectTrigger className="w-48 rounded-md">
                      <SelectValue placeholder={expenseType} />
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
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit Expense Types</span>
                  </Button>
                </div>
                {isEditingExpenseType && (
                  <div className="flex flex-col space-y-2 mt-2">
                    <Input
                      type="text"
                      placeholder="Enter new expense type"
                      className="rounded-md text-foreground/50 shadow-sm"
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
              <section className="space-y-2">
                <Label htmlFor="billAmount" className="text-foreground/50 font-medium">
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
                    className="rounded-l-none text-foreground shadow-sm"
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
              <section className="space-y-2">
                <Label htmlFor="participantName" className="text-foreground/50 font-medium">
                  Participants
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="participantName"
                    type="text"
                    placeholder="Enter participant name"
                    className="rounded-md text-foreground shadow-sm"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                  />
                  <Button onClick={handleAddParticipant} className="bg-teal-500 text-white hover:bg-teal-600 rounded-md shadow-md">
                    <User className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
                {participantNameError && (
                  <Alert variant="destructive" className="animate-shake">
                    <AlertTitle>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Error
                    </AlertTitle>
                    <AlertDescription>{participantNameError}</AlertDescription>
                  </Alert>
                )}
                {participants.length > 0 && (
                  <div className="mt-2">
                    <Label className="text-foreground/50 font-medium">List of Participants:</Label>
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
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Error
                    </AlertTitle>
                    <AlertDescription>{participantsError}</AlertDescription>
                  </Alert>
                )}
              </section>

              {/* Payer Selection Section */}
              <section className="space-y-2">
                <Label className="text-foreground/50 font-medium">Who Paid?</Label>
                <select
                  className="h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-foreground/50 dark:text-gray-300 shadow-sm appearance-none bg-no-repeat bg-right"
                  style={{
                    backgroundImage:
                      'url(data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0Ljk1IDEwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjt9LmNscy0ye2ZpbGw6IzQ0NDt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPmFycm93czwvdGl0bGU+PHJlY3QgY2xhc3M9ImNscy0xIiB3aWR0aD0iNC45NSIgaGVpZ2h0PSIxMCIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSIxLjQxIDQuNjcgMi40OCAzLjE4IDMuNTQgNC42NyAxLjQxIDQuNjciLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iMy41NCA1LjMzIDIuNDggNi44MiAxLjQxIDUuMzMgMy41NCA1LjMzIi8+PC9zdmc+)',
                    backgroundSize: '30px 35px',
                  }}
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
                      <AlertTriangle className="h-4 w-4 mr-2" />
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
                <Wallet className="mr-2 h-4 w-4" />
                Calculate Split
              </Button>



              {expenses.slice().reverse().map((expense, index) => {
                const currencySymbol = currencySymbols[expense.currency] || "$";
                return (
                  <Card key={index} className="w-full max-w-md space-y-6 p-6 rounded-xl shadow-md bg-white/80 backdrop-blur-sm border border-gray-200 mt-4 dark:bg-gray-800/80 dark:border-gray-700">
                    <CardHeader className="flex justify-between items-start flex-row items-center">
                      <CardTitle className="text-3xl font-semibold text-center text-foreground">
                        {expense.type}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteExpense(index)}
                        className="h-10 w-10 flex items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 focus:outline-none"
                      >
                        <Trash2 className="h-5 w-5" />
                        <span className="sr-only">Delete Expense</span>
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Owed Amounts Display Section */}
                      {Object.keys(expense.owedAmounts).length > 0 && (
                        <section className="mt-6 space-y-2">
                          <Label className="text-foreground/50 font-medium">Owed Amounts:</Label>
                          <ul>
                            {Object.entries(expense.owedAmounts).map(([name, amount]) => (
                              <li key={name} className="flex items-center justify-between py-2 border-b border-gray-200">
                                <div className="flex items-center space-x-2">
                                  {expense.payer === name ? (
                                    <>
                                      <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                                      <span className="font-semibold text-foreground">{name} (Payer)</span>
                                    </>
                                  ) : (
                                    <>
                                      <User className="mr-1 h-4 w-4 text-foreground" />
                                      <span className="text-foreground">{name}</span>
                                    </>
                                  )}
                                </div>
                                <span className="text-foreground">{currencySymbol}{amount.toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}
                      <Label className="text-foreground/50 font-medium">Total Amount Paid : </Label>
                      <span className="text-foreground">{currencySymbol}{expense.amount.toFixed(2)}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
            <TabsContent value="owedBreakdown" className="space-y-6">
              <section className="mt-6 space-y-2">
                <Label className="text-foreground/50 font-medium">Simplified Owed Amounts:</Label>
                <ul>
                  {calculateSimplifiedOwedAmounts().map((transaction, index) => {
                    // Determine the currency symbol based on the transaction's currency
                    const currencySymbol = currencySymbols[transaction.currency] || "$";
                    return (
                      <li key={index} className="flex items-center justify-between py-2 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                          <span className="text-foreground">{transaction.to}</span>
                          <span className="text-foreground/50">owes</span>
                          <span className="text-foreground">{transaction.from}</span>
                        </div>
                        {/* Display amount with the correct currency symbol */}
                        <span className="text-foreground">{currencySymbol}{transaction.amount.toFixed(2)}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <Card className="w-full max-w-md space-y-6 p-6 rounded-xl shadow-md bg-white/80 backdrop-blur-sm border border-gray-200 mt-4 dark:bg-gray-800/80 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-3xl font-semibold text-center text-foreground">
                    Total Owed Amounts:
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Owed Amounts Display Section */}
                  {Object.keys(totalOwedAmounts()).length > 0 && (
                    <section className="mt-6 space-y-2">
                      <ul>
                        {Object.entries(totalOwedAmounts()).map(([name, amount]) => {
                          // Determine the currency for this person's owed amount.
                          // It's more robust to fetch it from expenses than rely on a default.
                          const relevantExpense = expenses.find(expense => name in expense.owedAmounts);
                          const currency = relevantExpense ? relevantExpense.currency : "USD"; // Fallback to USD if no currency found
                          const currencySymbol = currencySymbols[currency] || "$"; // Get the symbol for the currency

                          return (
                            <li key={name} className="flex items-center justify-between py-2 border-b border-gray-200">
                              <div className="flex items-center space-x-2">
                                <User className="mr-1 h-4 w-4 text-foreground" />
                                <span className="text-foreground">{name}</span>
                              </div>
                              <span className="text-foreground">{currencySymbol}{amount.toFixed(2)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )}
                </CardContent>
              </Card>

            </TabsContent>
          </Tabs>
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


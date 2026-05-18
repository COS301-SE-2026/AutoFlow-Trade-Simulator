import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Currency} from "@/lib/types/currencies";

export function DialogDemo() {
    return (
        <Dialog>
            <form>
                <DialogTrigger asChild>
                    <Button variant="outline">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm hero">
                    <DialogHeader>
                        <DialogTitle>Add New International Account</DialogTitle>
                        <DialogDescription>
                            Here you can add demo accounts in different major world currencies.
                        </DialogDescription>
                    </DialogHeader>
                    <FieldGroup>
                        <Field>
                            <Label htmlFor="role-1">Currency</Label>
                            <Select name="role">
                                <SelectTrigger id="role-1" className="w-full">
                                    <SelectValue placeholder="Select a currency" />
                                </SelectTrigger>
                                <SelectContent style={{
                                    backgroundColor: 'var(--accent-strong)',
                                    color: 'var(--text)',

                                }}>
                                    <SelectGroup>
                                        {Object.values(Currency)?.map((curr) => (
                                            <SelectItem key={curr} value={curr}>
                                                {curr}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field>
                            <Label htmlFor="initialBalance-1">Initial Balance</Label>
                            <Input type="number" id="initialBalance-1" name="initialBalance" defaultValue="100.00" />
                        </Field>
                    </FieldGroup>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    )
}

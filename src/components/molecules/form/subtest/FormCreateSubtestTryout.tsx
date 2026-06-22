"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Check, ChevronsUpDown, Plus, Trash2, Wand2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { toast } from "sonner";
import { getErrorMessage } from "@/utils/get-error-message";

import {
  subtestTryoutSchema,
  SubtestTryoutType,
} from "@/validators/subtest/subtest-tryout-validator";

import { useSession } from "next-auth/react";
import { useGetAllSubtest } from "@/http/subtest/get-all-subtest";

import { useState } from "react";
import { useCreateSubtestTryout } from "@/http/subtest/create-subtest-tryout";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FormCreateSubtestTryoutProps {
  tryoutId: string;
  setOpen: (open: boolean) => void;
}

export default function FormCreateSubtestTryout({
  tryoutId,
  setOpen,
}: FormCreateSubtestTryoutProps) {
  const { data: session, status } = useSession();

  const { data } = useGetAllSubtest({
    token: session?.access_token as string,
    options: {
      enabled: status === "authenticated",
    },
  });

  const [openSubtest, setOpenSubtest] = useState<number | null>(null);

  const form = useForm<SubtestTryoutType>({
    resolver: zodResolver(subtestTryoutSchema),
    defaultValues: {
      subtests: [
        {
          subtest_id: "",
          duration_minutes: 30,
          is_active: true,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subtests",
  });

  const queryClient = useQueryClient();

  const { mutate: createHandler, isPending } = useCreateSubtestTryout({
    onError: (error: unknown) => {
      const message = getErrorMessage(error, "Terjadi kesalahan.");

      toast.error("Gagal menambahkan subtest!", {
        description: message,
      });
    },
    onSuccess: () => {
      toast.success("Subtest berhasil ditambahkan!");

      queryClient.invalidateQueries({
        queryKey: ["get-subtest-by-tryout"],
      });

      setOpen(false);
    },
  });

  const onSubmit = (body: SubtestTryoutType) => {
    createHandler({ id: tryoutId, body });
  };

  const handleBulkAppend = () => {
    const currentSubtests = form.getValues("subtests");
    const lastValidSubtest = currentSubtests.slice().reverse().find(s => s.subtest_id !== "");
    
    if (!lastValidSubtest || !data?.data) {
      toast.error("Pilih minimal satu subtes terlebih dahulu sebelum menggunakan Auto-Fill.");
      return;
    }
    
    const selectedId = lastValidSubtest.subtest_id;
    const selectedSubtest = data.data.find(s => s.id === selectedId);
    if (!selectedSubtest) return;

    // Detect prefix (e.g. "UM06_", "TO1-", "SNBT ")
    const match = selectedSubtest.name.match(/^([^_\-\s]+[_\-\s]+)/);
    if (!match) {
      toast.error("Tidak ditemukan format awalan kode (misal: UM06_) pada nama subtes ini.");
      return;
    }

    const prefix = match[0];
    const relatedSubtests = data.data.filter(s => s.name.startsWith(prefix) && s.id !== selectedId);

    if (relatedSubtests.length === 0) {
      toast.error(`Tidak ada subtes lain yang berawalan "${prefix}".`);
      return;
    }

    const currentIds = form.getValues("subtests").map(s => s.subtest_id);
    const toAdd = relatedSubtests.filter(s => !currentIds.includes(s.id));

    if (toAdd.length === 0) {
      toast.info(`Semua subtes berawalan "${prefix}" sudah ada di dalam form.`);
      return;
    }

    toAdd.forEach(s => {
      append({
        subtest_id: s.id,
        duration_minutes: 30,
        is_active: true
      });
    });

    toast.success(`Berhasil menambahkan ${toAdd.length} subtes berawalan "${prefix}".`);
  };

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <ScrollArea className="h-[420px]">
        <div className="space-y-4">
          {fields.map((item, index) => (
            <Card key={item.id} className="overflow-visible">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold">
                  Subtest #{index + 1}
                </CardTitle>

                {fields.length > 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <FieldGroup className="flex flex-col md:flex-row items-start md:items-end">
                  {/* SUBTEST SELECT */}
                  <Controller
                    control={form.control}
                    name={`subtests.${index}.subtest_id`}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="w-full md:flex-[2]"
                      >
                        <FieldLabel>Subtest</FieldLabel>

                        <Popover
                          modal={true}
                          open={openSubtest === index}
                          onOpenChange={(open) =>
                            setOpenSubtest(open ? index : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between"
                            >
                              <span className="truncate">
                                {field.value
                                  ? data?.data?.find((s) => s.id === field.value)?.name
                                  : "Pilih subtest"}
                              </span>
                              <ChevronsUpDown className="opacity-50 shrink-0 ml-2" />
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="p-0">
                            <Command>
                              <CommandInput placeholder="Cari subtest..." />
                              <CommandList>
                                <CommandEmpty>Tidak ditemukan</CommandEmpty>

                                <CommandGroup>
                                  {data?.data?.map((subtest) => (
                                    <CommandItem
                                      key={subtest.id}
                                      value={subtest.name}
                                      onSelect={() => {
                                        field.onChange(subtest.id);
                                        setOpenSubtest(null);
                                      }}
                                    >
                                      {subtest.name}

                                      <Check
                                        className={cn(
                                          "ml-auto",
                                          field.value === subtest.id
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  {/* DURATION */}
                  <Controller
                    control={form.control}
                    name={`subtests.${index}.duration_minutes`}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="w-full md:flex-1"
                      >
                        <FieldLabel>Durasi (Menit)</FieldLabel>

                        <Input
                          type="number"
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />

                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  {/* STATUS */}
                  <Controller
                    control={form.control}
                    name={`subtests.${index}.is_active`}
                    render={({ field }) => (
                      <Field className="w-full md:flex-[0.5]">
                        <FieldLabel>Status</FieldLabel>

                        <div className="flex items-center gap-3">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />

                          <span className="text-sm text-muted-foreground">
                            {field.value ? "Aktif" : "Tidak Aktif"}
                          </span>
                        </div>
                      </Field>
                    )}
                  />
                </FieldGroup>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* ADD SUBTEST & AUTO FILL */}
      <div className="flex gap-3 w-full">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={() =>
            append({
              subtest_id: "",
              duration_minutes: 30,
              is_active: true,
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Subtest
        </Button>

        <Button
          type="button"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleBulkAppend}
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Auto-Fill
        </Button>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Loading..." : "Tambahkan"}
        </Button>
      </div>
    </form>
  );
}

<template>
  <div class="card grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
    <div
      v-for="field in clientFormFields"
      :key="field.key"
      :class="field.class"
    >
      <div v-if="field.type === 'separator'" :class="field.class">
        <div>{{ field.text }}</div>
      </div>

      <div v-if="field.type === 'text'">
        <div v-if="field.multiple">
          <div v-if="field.key === 'ibans'" class="flex flex-col gap-2">
            <div
              v-for="(bank, index) in clientData.ibans"
              :key="index"
              class="flex flex-col items-center gap-y-4"
            >
              <InputGroup
                :class="{
                  'disabled-field':
                    field.key !== 'fiscal_code' && !fiscalCodeNotExists,
                }"
              >
                <InputGroupAddon>
                  <i class="pi pi-home"></i>
                </InputGroupAddon>
                <FloatLabel variant="on" class="w-full">
                  <InputText v-model="bank.bank_name" class="w-full" />
                  <label>Istituto di credito</label>
                </FloatLabel>
                <InputGroupAddon>
                  <i class="pi pi-credit-card"></i>
                </InputGroupAddon>
                <FloatLabel variant="on" class="w-full">
                  <InputText v-model="bank.iban" class="w-full" />
                  <label>IBAN</label>
                </FloatLabel>
                <InputGroupAddon
                  v-if="clientData.ibans.length > 1"
                  style="padding: 0"
                >
                  <Button
                    icon="pi pi-minus"
                    class="p-button-secondary"
                    @click="removeIban(index)"
                    outlined
                    style="border: none"
                  />
                </InputGroupAddon>
                <InputGroupAddon style="padding: 0">
                  <Button
                    icon="pi pi-plus"
                    class="p-button-secondary"
                    @click="addIban"
                    outlined
                    style="border: none"
                  />
                </InputGroupAddon>
              </InputGroup>
              <div class="flex gap-x-4 w-full">
                <InputGroup
                  :class="{
                    'disabled-field':
                      field.key !== 'fiscal_code' && !fiscalCodeNotExists,
                  }"
                >
                  <InputGroupAddon>
                    <i class="pi pi-building"></i>
                  </InputGroupAddon>
                  <FloatLabel variant="on" class="w-full">
                    <InputText v-model="bank.branch" class="w-full" />
                    <label>Filiale di</label>
                  </FloatLabel>
                </InputGroup>
                <InputGroup
                  :class="{
                    'disabled-field':
                      field.key !== 'fiscal_code' && !fiscalCodeNotExists,
                  }"
                >
                  <InputGroupAddon>
                    <i class="pi pi-money-bill"></i>
                  </InputGroupAddon>
                  <FloatLabel variant="on" class="w-full">
                    <InputText v-model="bank.import" class="w-full" />
                    <label>Importo</label>
                  </FloatLabel>
                </InputGroup>
              </div>
            </div>
          </div>
          <div
            v-else-if="field.key === 'addresses'"
            class="flex flex-col gap-2"
          >
            <div
              v-for="(address, index) in clientData.addresses"
              :key="index"
              class="flex items-center"
            >
              <InputGroup
                :class="{
                  'disabled-field':
                    field.key !== 'fiscal_code' && !fiscalCodeNotExists,
                }"
              >
                <InputGroupAddon>
                  <i :class="field.icon"></i>
                </InputGroupAddon>
                <InputGroupAddon v-if="clientData.addresses.length > 1">
                  <div class="font-bold">{{ index + 1 }}</div>
                </InputGroupAddon>
                <FloatLabel variant="on" class="w-full">
                  <AutoComplete
                    v-model="selectedPlacesA[index]"
                    :suggestions="suggestionsA[index]"
                    optionLabel="label"
                    @complete="fetchPlacePredictionsA(index)"
                    @select="onSelectA(index)"
                    class="w-full"
                    :class="{
                      'disabled-field':
                        field.key !== 'fiscal_code' && !fiscalCodeNotExists,
                    }"
                  >
                    <template #option="slotProps">
                      <div class="flex items-center">
                        <div>{{ slotProps.option.label }}</div>
                      </div>
                    </template>
                  </AutoComplete>
                  <label>{{ field.label }}</label>
                </FloatLabel>
                <InputGroupAddon
                  style="padding: 0"
                  v-if="
                    index + 1 === clientData.addresses.length &&
                    clientData.addresses.length > 1
                  "
                >
                  <Button
                    icon="pi pi-minus"
                    class="p-button-secondary"
                    @click="removeAddress(index)"
                    outlined
                    style="border: none"
                  />
                </InputGroupAddon>
                <InputGroupAddon
                  style="padding: 0"
                  v-if="index + 1 === clientData.addresses.length"
                >
                  <Button
                    icon="pi pi-plus"
                    class="p-button-secondary"
                    @click="addAddress"
                    outlined
                    style="border: none"
                  />
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
          <div v-else class="flex flex-col gap-2">
            <div v-for="index in field.size" :key="index" class="w-full flex">
              <InputGroup
                :class="{
                  'disabled-field':
                    field.key !== 'fiscal_code' && !fiscalCodeNotExists,
                }"
              >
                <InputGroupAddon>
                  <i :class="field?.icon || 'pi pi-info'"></i>
                </InputGroupAddon>
                <InputGroupAddon v-if="field.size > 1">
                  <div class="font-bold">{{ index }}</div>
                </InputGroupAddon>
                <FloatLabel variant="on">
                  <InputText
                    v-if="field.key === 'phones'"
                    v-model="clientData[field.key][index - 1]"
                    :id="field.key"
                    :autoClear="false"
                  />
                  <InputText
                    v-if="field.key !== 'phones'"
                    v-model="clientData[field.key][index - 1]"
                    ref="addressInput"
                    :id="field.key"
                  />

                  <label :for="field.key">{{ field.label }}</label>
                </FloatLabel>
                <InputGroupAddon
                  style="padding: 0"
                  v-if="index === field.size && index !== 1"
                >
                  <Button
                    icon="pi pi-minus"
                    severity="secondary"
                    @click="field.size > 1 && field.size--"
                    outlined
                    style="border: none"
                  />
                </InputGroupAddon>
                <InputGroupAddon style="padding: 0" v-if="index === field.size">
                  <Button
                    icon="pi pi-plus"
                    severity="secondary"
                    @click="field.size++"
                    outlined
                    style="border: none"
                  />
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
        </div>

        <div v-else>
          <InputGroup
            :class="{
              'disabled-field':
                field.key !== 'fiscal_code' && !fiscalCodeNotExists,
              'p-invalid': v$[field.key]?.$error,
            }"
          >
            <InputGroupAddon>
              <i :class="field?.icon || 'pi pi-info'"></i>
            </InputGroupAddon>
            <FloatLabel variant="on">
              <AutoComplete
                id="address"
                v-model="selectedPlace"
                :suggestions="suggestions"
                optionLabel="label"
                @complete="fetchPlacePredictions"
                @select="onSelect"
                class="w-full md:w-56"
                :name="field.key"
                v-if="field.key === 'legal_address'"
              >
                <!--              @change="additionalFieldErrors.legalAddress = false"-->
                <template #option="slotProps">
                  <div class="flex items-center">
                    <div>{{ slotProps.option.label }}</div>
                  </div>
                </template>
              </AutoComplete>
              <InputText
                v-else
                :id="field.key"
                v-model="clientData[field.key]"
              />
              <label :for="field.key">{{ field.label }}</label>
            </FloatLabel>
            <Button
              v-if="field.key === 'vat_number'"
              severity="info"
              label="Duplica"
              :icon="field.icon"
              @click="copyFiscalCode"
              :disabled="!fiscalCodeNotExists"
              style="width: 8rem; opacity: 100%"
              class=""
              outlined
            />
          </InputGroup>
          <small v-if="v$[field.key]?.$error" class="p-invalid">{{
            field.error_msg
          }}</small>
        </div>

        <Button
          v-if="
            field.key === 'fiscal_code' && fiscalCodeExists && fiscalCodeChanged
          "
          label="A user with this fiscal code already exists. Would you like to view their details?"
          @click="viewExistingClient"
          class="mt-4 w-full"
          severity="help"
        />
      </div>

      <div
        v-if="field.type === 'select' && !field?.hidden"
        class="flex items-center gap-4"
      >
        <InputGroup
          :class="{
            'disabled-field':
              field.key !== 'fiscal_code' && !fiscalCodeNotExists,
            'p-invalid': v$[field.key]?.$error,
          }"
        >
          <InputGroupAddon>
            <i :class="field?.icon || 'pi pi-info'"></i>
          </InputGroupAddon>
          <FloatLabel class="w-full" variant="on">
            <Select
              :inputId="field.key"
              v-model="clientData[field.key]"
              :options="field.options"
              class="w-full"
              optionLabel="label"
              v-if="field.key.indexOf('ateco') !== -1"
            >
              <template #value="slotProps">
                <div v-if="slotProps.value">{{ slotProps.value.label }}</div>
              </template>
              <template #option="slotProps">
                <div class="w-96 whitespace-normal">
                  {{ slotProps.option.label }}
                </div>
              </template>
            </Select>

            <Select
              v-else
              :id="field.key"
              v-model="clientData[field.key]"
              :options="field.options"
              class="w-full"
            />

            <label :for="field.key">{{ field.label }}</label>
          </FloatLabel>
          <InputGroupAddon
            v-if="field.key === 'company_size'"
            v-tooltip="{ value: clientData.explanation }"
          >
            <i class="pi pi-info"></i>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div v-if="field.type === 'form' && field.key === 'annual_billings'">
        <div
          v-for="(billing, index) in clientData.annual_billings"
          :key="billing.year"
          class="col-span-2 flex items-center gap-4 mb-4"
        >
          <InputGroup
            :class="{
              'disabled-field':
                field.key !== 'fiscal_code' && !fiscalCodeNotExists,
            }"
          >
            <InputGroupAddon>
              <div class="px-10 font-bold">{{ billing.year }}</div>
            </InputGroupAddon>

            <FloatLabel variant="on">
              <InputNumber
                :id="'revenue-' + billing.year"
                v-model="billing.revenue"
              />
              <label :for="'revenue-' + billing.year" class="relative inline-flex items-center">
                Fatturato
                <span v-tooltip="'Campo obbligatorio'" class="text-red-500 ml-1 cursor-help">*</span>
              </label>
            </FloatLabel>
            <FloatLabel variant="on">
              <InputNumber
                :id="'employee_count-' + billing.year"
                v-model="billing.employee_count"
                :useGrouping="false"
              />
              <label :for="'employee_count-' + billing.year" class="relative inline-flex items-center">
                Numero Dipendenti
                <span v-tooltip="'Campo obbligatorio'" class="text-red-500 ml-1 cursor-help">*</span>
              </label>
            </FloatLabel>
            <FloatLabel variant="on">
              <InputNumber
                :id="'assets-' + billing.year"
                v-model="billing.assets"
              />
              <label :for="'assets-' + billing.year" class="relative inline-flex items-center">
                Attivo
                <span v-tooltip="'Campo obbligatorio'" class="text-red-500 ml-1 cursor-help">*</span>
              </label>
            </FloatLabel>
            <InputGroupAddon style="padding: 0">
              <Button
                icon="pi pi-times"
                severity="danger"
                @click="removeYear(index)"
                style="border: none"
                outlined
              />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div class="flex justify-end">
          <Button
            v-if="clientData.annual_billings.length < 5"
            label="Aggiungi"
            severity="success"
            icon="pi pi-plus"
            @click="addAnnualBilling"
            :class="{
              'disabled-field':
                field.key !== 'fiscal_code' && !fiscalCodeNotExists,
            }"
            outlined
          />
        </div>
      </div>

      <!-- Client Contacts Form -->
      <div v-if="field.key === 'client_contacts'" class="mb-6">
        <div
          v-for="(contact, contactIndex) in clientData.client_contacts"
          :key="contactIndex"
          class="pt-4 pb-8 px-4 mb-6 border rounded-xl bg-surface-100"
        >
          <div class="text-surface-500 mb-4 text-lg">
            Referente {{ contactIndex + 1 }}
          </div>
          <div class="flex items-center gap-4 w-full">
            <InputGroup class="w-full">
              <InputGroupAddon>
                <i class="pi pi-user"></i>
              </InputGroupAddon>
              <FloatLabel variant="on" class="w-full">
                <InputText
                  :id="'name-' + contactIndex"
                  v-model="contact.name"
                  class="w-full"
                />
                <label :for="'name-' + contactIndex">Nome</label>
              </FloatLabel>
            </InputGroup>
            <InputGroup class="w-full">
              <InputGroupAddon>
                <i class="pi pi-user"></i>
              </InputGroupAddon>
              <FloatLabel variant="on" class="w-full">
                <InputText
                  :id="'surname-' + contactIndex"
                  v-model="contact.surname"
                  class="w-full"
                />
                <label :for="'surname-' + contactIndex">Cognome</label>
              </FloatLabel>
            </InputGroup>
            <Button
              icon="pi pi-trash"
              class="p-button-danger"
              style="padding: 8px 20px"
              @click="removeContact(contactIndex)"
              outlined
            />
          </div>

          <!-- Phones -->
          <div
            v-for="(phone, phoneIndex) in contact.phones"
            :key="phoneIndex"
            class="flex items-center gap-4 mt-4 w-full"
          >
            <InputGroup class="w-full">
              <InputGroupAddon>
                <i class="pi pi-phone"></i>
              </InputGroupAddon>
              <FloatLabel variant="on" class="w-full">
                <InputText
                  :id="'phone-' + contactIndex + '-' + phoneIndex"
                  v-model="contact.phones[phoneIndex]"
                />
                <label :for="'phone-' + contactIndex + '-' + phoneIndex"
                  >Telefono</label
                >
              </FloatLabel>
              <InputGroupAddon>
                <div class="font-bold">{{ phoneIndex + 1 }}</div>
              </InputGroupAddon>
            </InputGroup>
            <Button
              icon="pi pi-minus"
              class="p-button-secondary"
              @click="removePhone(contactIndex, phoneIndex)"
              :disabled="contact.phones.length <= 1"
            />
            <Button
              icon="pi pi-plus"
              class="p-button-secondary"
              @click="addPhone(contactIndex)"
            />
          </div>

          <!-- Emails -->
          <div
            v-for="(email, emailIndex) in contact.emails"
            :key="emailIndex"
            class="flex items-center gap-4 mt-4 w-full"
          >
            <InputGroup class="w-full">
              <InputGroupAddon>
                <i class="pi pi-envelope"></i>
              </InputGroupAddon>
              <FloatLabel variant="on" class="w-full">
                <InputText
                  :id="'email-' + contactIndex + '-' + emailIndex"
                  v-model="contact.emails[emailIndex]"
                  class="w-full"
                />
                <label :for="'email-' + contactIndex + '-' + emailIndex"
                  >Email</label
                >
              </FloatLabel>
              <InputGroupAddon>
                <div class="font-bold">{{ emailIndex + 1 }}</div>
              </InputGroupAddon>
            </InputGroup>
            <Button
              icon="pi pi-minus"
              class="p-button-secondary"
              @click="removeEmail(contactIndex, emailIndex)"
              :disabled="contact.emails.length <= 1"
            />
            <Button
              icon="pi pi-plus"
              class="p-button-secondary"
              @click="addEmail(contactIndex)"
            />
          </div>

          <!-- Roles -->
          <div
            v-for="(role, roleIndex) in contact.roles"
            :key="roleIndex"
            class="flex items-center gap-4 mt-4 w-full"
          >
            <InputGroup class="w-full">
              <InputGroupAddon>
                <i class="pi pi-sitemap"></i>
              </InputGroupAddon>
              <FloatLabel variant="on" class="w-full">
                <InputText
                  :id="'role-' + contactIndex + '-' + roleIndex"
                  v-model="contact.roles[roleIndex]"
                  class="w-full"
                />
                <label :for="'role-' + contactIndex + '-' + roleIndex"
                  >Ruolo</label
                >
              </FloatLabel>

              <InputGroupAddon>
                <div class="font-bold">{{ roleIndex + 1 }}</div>
              </InputGroupAddon>
            </InputGroup>
            <Button
              icon="pi pi-minus"
              class="p-button-secondary"
              @click="removeRole(contactIndex, roleIndex)"
              :disabled="contact.roles.length <= 1"
            />
            <Button
              icon="pi pi-plus"
              class="p-button-secondary"
              @click="addRole(contactIndex)"
            />
          </div>
        </div>
      </div>

      <!-- Related Clients Section -->
      <div v-if="field.key === 'related_clients'" class="col-span-2">
        <div
          v-for="(relatedClient, relatedIndex) in clientData.related_clients"
          :key="relatedIndex"
          class="pt-4 pb-8 px-4 mb-6 border rounded-xl bg-surface-100"
        >
          <div class="flex justify-between items-center pb-2">
            <div class="text-surface-500 text-lg">
              Impresa {{ relatedIndex + 1 }}
            </div>
            <Button
              icon="pi pi-times"
              @click="removeRelatedClient(relatedIndex)"
              severity="danger"
              outlined
            />
          </div>

          <div class="flex flex-col gap-4">
            <!-- Fiscal Code Field -->
            <div class="flex flex-col items-center gap-2">
              <InputGroup
                class="w-full"
                :class="{
                  'p-invalid':
                    v$[`related_clients.${relatedIndex}.fiscal_code`]?.$error,
                }"
              >
                <InputGroupAddon>
                  <i class="pi pi-key"></i>
                </InputGroupAddon>
                <FloatLabel variant="on">
                  <InputText
                    v-model="relatedClient.fiscal_code"
                    class="w-full"
                  />
                  <label>Codice fiscale</label>
                </FloatLabel>
              </InputGroup>
              <small
                v-if="v$[`related_clients.${relatedIndex}.fiscal_code`]?.$error"
                class="p-invalid text-[#f87171]"
                >{{
                  v$[`related_clients.${relatedIndex}.fiscal_code`]
                    ?.validateFiscalCodeRelatedClient.$message
                }}
              </small>
            </div>

            <!-- VAT Number Field -->
            <div class="flex items-center gap-2">
              <InputGroup
                class="w-full"
                :class="{ 'disabled-field': relatedClient.client_exists }"
              >
                <InputGroupAddon>
                  <i class="pi pi-tag"></i>
                </InputGroupAddon>
                <InputText
                  v-model="relatedClient.vat_number"
                  placeholder="Partita IVA"
                  class="w-full"
                />
                <Button
                  label="Duplica"
                  @click="duplicateVatNumber(relatedClient)"
                  class="ml-2"
                  outlined
                />
              </InputGroup>
            </div>

            <!-- Legal Name Field -->
            <div class="flex flex-col items-center gap-2">
              <InputGroup
                class="w-full"
                :class="{
                  'disabled-field': relatedClient.client_exists,
                  'p-invalid':
                    v$[`related_clients.${relatedIndex}.legal_name`]?.$error,
                }"
              >
                <InputGroupAddon>
                  <i class="pi pi-id-card"></i>
                </InputGroupAddon>
                <FloatLabel variant="on">
                  <InputText
                    v-model="relatedClient.legal_name"
                    class="w-full"
                  />
                  <label>Nome legale</label>
                </FloatLabel>
              </InputGroup>
            </div>
            <small
              v-if="v$[`related_clients.${relatedIndex}.legal_name`]?.$error"
              class="p-invalid text-[#f87171]"
              >{{
                v$[`related_clients.${relatedIndex}.legal_name`]
                  ?.validateLegalNameRelatedClient.$message
              }}
            </small>

            <!-- Percentage Field -->
            <div class="flex items-center gap-2">
              <InputGroup class="w-full">
                <InputGroupAddon>
                  <i class="pi pi-percentage"></i>
                </InputGroupAddon>
                <FloatLabel variant="on">
                  <InputNumber
                    v-model="relatedClient.percentage"
                    inputId="minmax"
                    :min="0"
                    :max="100"
                    class="w-full"
                  />
                  <label>Percentuale</label>
                </FloatLabel>
              </InputGroup>
            </div>

            <!-- Annual Billings -->
            <div
              v-for="(billing, billingIndex) in relatedClient.annual_billings"
              :key="billingIndex"
              class="flex items-center gap-4"
            >
              <InputGroup>
                <InputGroupAddon>
                  <div class="px-10 font-bold">{{ billing.year }}</div>
                </InputGroupAddon>
                <FloatLabel variant="on">
                  <InputNumber
                    :id="'revenue-' + billing.year"
                    v-model="billing.revenue"
                  />
                  <label :for="'revenue-' + billing.year">Fatturato</label>
                </FloatLabel>
                <FloatLabel variant="on">
                  <InputNumber
                    :id="'employee_count-' + billing.year"
                    v-model="billing.employee_count"
                    :useGrouping="false"
                  />
                  <label :for="'employee_count-' + billing.year"
                    >Numero Dipendenti</label
                  >
                </FloatLabel>
                <FloatLabel variant="on">
                  <InputNumber
                    :id="'assets-' + billing.year"
                    v-model="billing.assets"
                  />
                  <label :for="'assets-' + billing.year">Attivo</label>
                </FloatLabel>
                <InputGroupAddon style="padding: 0">
                  <Button
                    icon="pi pi-times"
                    severity="danger"
                    @click="removeRelatedBilling(relatedIndex, billingIndex)"
                    v-if="
                      relatedClient.annual_billings.length > 1 &&
                      billing.year <= new Date().getFullYear() - 2
                    "
                    style="border: none"
                    outlined
                  />
                </InputGroupAddon>
              </InputGroup>
            </div>
            <div class="flex justify-end">
              <Button
                v-if="relatedClient.annual_billings.length < 5"
                :label="
                  'Aggiungi anno ' + relatedClient.annual_billings.length > 0
                    ? relatedClient.annual_billings[
                        relatedClient.annual_billings.length - 1
                      ].year - 1
                    : new Date().getFullYear() - 1
                "
                severity="success"
                icon="pi pi-plus"
                @click="addRelatedBilling(relatedIndex)"
                outlined
              />
            </div>

            <!-- Button to create related clients -->
            <div class="flex justify-end mt-4">
              <Button
                label="Crea Cliente Relazionato"
                icon="pi pi-plus"
                @click="createRelatedClient(relatedIndex)"
                outlined
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="field.type === 'button'" class="flex justify-end">
        <Button
          :label="field.label"
          :icon="field.icon"
          @click="field.action"
          class="mt-2"
          :class="{
            'disabled-field':
              field.key !== 'fiscal_code' && !fiscalCodeNotExists,
          }"
          outlined
          :severity="field?.severity"
        />
      </div>

      <div v-if="field.type === 'upload'" class="flex flex-col">
        <div v-if="clientData.files !== null">
          <div
            class="flex justify-between mb-4"
            v-for="file in clientData.files"
            :key="file.id"
          >
            <div>
              <img
                v-if="isImage(file?.link)"
                :src="file?.link"
                alt="Preview"
                class="w-16 h-16 object-cover"
              />
              <div v-else class="flex items-center gap-1">
                <i class="pi pi-file" style="font-size: 1.5em"></i>
                <span class="file-name !max-w-72">{{ file?.name }}</span>
              </div>
            </div>

            <div class="flex gap-2">
              <a
                :href="file?.link"
                target="_blank"
                class="p-button p-button-outlined p-button-secondary p-mr-2"
              >
                <i class="pi pi-external-link"></i>
              </a>
              <a
                :href="file?.link"
                target="_blank"
                download
                class="p-button p-button-outlined p-button-secondary"
              >
                <i class="pi pi-download"></i>
              </a>
              <Button
                icon="pi pi-trash"
                class="p-button p-button-outlined p-button-danger"
              />
            </div>
          </div>
        </div>
        <div class="flex justify-between">
          <FileUpload
            mode="basic"
            name="file"
            :maxFileSize="1000000"
            customUpload
            chooseLabel="Carica visura"
            class="p-button-outlined"
            :class="{
              'disabled-field':
                field.key !== 'fiscal_code' && !fiscalCodeNotExists,
            }"
            @select="onFileSelect"
            auto
            severity="secondary"
          />
          <Button
            label="Apri Google Drive"
            icon="pi pi-folder-open"
            @click="openGoogleDrive"
            severity="success"
            outlined
          />
        </div>

        <div>
          <button
            v-if="showUploadButton"
            @click="uploadSelectedFiles"
            style="
              background-color: #4caf50;
              color: white;
              margin-left: 15px;
              padding: 8px 32px;
              text-align: center;
              text-decoration: none;
              display: inline-block;
              font-size: 16px;
              margin: 4px 2px;
              cursor: pointer;
              border: none;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
              transition: background-color 0.3s ease;
            "
            onmouseover="this.style.backgroundColor='#45a049'"
            onmouseout="this.style.backgroundColor='#4CAF50'"
          >
            Carica file selezionati
          </button>
        </div>
      </div>
    </div>
    <div class="flex">
      <Button
        v-if="props.mode === 'update'"
        label="Scarica"
        icon="pi pi-download"
        @click="downloadFile"
        outlined
        class="w-full"
      />
    </div>
    <div class="flex justify-center gap-4 col-span-2 mt-16">
      <Button
        :label="mode === 'create' ? 'Creare' : 'Aggiorna'"
        severity="success"
        icon="pi pi-check"
        class="w-64"
        @click="submitClient"
        :disabled="!fiscalCodeNotExists"
        outlined
      />
      <Button
        label="Annulla"
        severity="warn"
        icon="pi pi-times"
        class="w-64"
        @click="cancelClient"
        outlined
      />
    </div>
  </div>
</template>



<script setup>
import { onMounted, ref, watch } from "vue";
import apiClient from "@/router/apiClient";
import { useStore } from "@/store";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import { useVuelidate } from "@vuelidate/core";
import { required, helpers } from "@vuelidate/validators";

import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import FloatLabel from "primevue/floatlabel";
import InputGroup from "primevue/inputgroup";
import InputNumber from "primevue/inputnumber";
import InputGroupAddon from "primevue/inputgroupaddon";
import FileUpload from "primevue/fileupload";
import AutoComplete from "primevue/autocomplete";
import { Loader } from "@googlemaps/js-api-loader";
//import { google } from "googleapis";
function removeFile(index) {
  // Rimuovi il file selezionato dall'array
  selectedGoogleFiles.value.splice(index, 1);
}

const showUploadButton = ref(false);
const gConfig = ref({
  developerKey: import.meta.env.VITE_GOOGLE_PICKER_API_KEY,
  clientId: import.meta.env.VITE_GOOGLE_PICKER_CLIENT_ID,
  scope: "https://www.googleapis.com/auth/drive", // messo lo scope generico .file non aveva abbastanza permessi
  appId: import.meta.env.VITE_GOOGLE_PICKER_APP_ID,
});
let pickerInited = false;
let gisInited = false;
let tokenClient;
let accessToken = null;
const selectedGoogleFiles = ref([]);

// Funzione per aprire Google Drive

async function loadGapi() {
  // Carica il client e il picker di Google
  await new Promise((resolve) => {
    gapi.load("client:picker", resolve);
  });
}
async function uploadSelectedFiles() {
  const formData = new FormData();

  for (const file of selectedGoogleFiles.value) {
    if (file.id) {
      try {
        const fileData = await downloadFileFromGoogleDrive(
          file.id,
          accessToken
        );

        formData.append("file[]", fileData, file.name);
      } catch (error) {
        console.error(`Errore nel download del file con ID ${file.id}:`, error);
        continue;
      }
    }
  }

  // Aggiungi l'accessToken se necessario
  formData.append("accessToken", accessToken);

  try {
    const response = await apiClient.post(
      `${store.api}/clients/${clientData.value.id}/filesdrive`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${store.token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // Gestisci la risposta
  } catch (error) {
    console.error("Errore durante il caricamento dei file:", error);
  }
}

async function openGoogleDrive() {
  await loadGapi();

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: gConfig.value.clientId,
    scope: gConfig.value.scope,
    callback: async (response) => {
      if (response.error) {
        return;
      }

      accessToken = response.access_token;

      if (accessToken) {
        createPicker(accessToken);
      }
    },
  });

  if (!accessToken) {
    tokenClient.requestAccessToken({ prompt: "consent" });
  } else {
    createPicker(accessToken);
  }
}

async function initializePicker() {
  await gapi.client.load(
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
  );
  pickerInited = true;
}

function gapiLoaded() {
  gapi.load("client:picker", initializePicker);
}

async function createPicker(accessToken) {
  const view = new google.picker.View(google.picker.ViewId.DOCS);
  view.setMimeTypes("image/png,image/jpeg,image/jpg,application/pdf");
  const folderView = new google.picker.View(google.picker.ViewId.FOLDERS);

  const picker = new google.picker.PickerBuilder()
    .enableFeature(google.picker.Feature.NAV_HIDDEN)
    .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
    .setDeveloperKey(import.meta.env.VITE_GOOGLE_PICKER_API_KEY)
    .setAppId(import.meta.env.VITE_GOOGLE_PICKER_APP_ID)
    .setOAuthToken(accessToken)
    .addView(view)
    .addView(new google.picker.DocsUploadView())
    .addView(folderView)
    .setCallback(pickerCallback)
    .build();
  picker.setVisible(true);
}
function pickerCallback(data) {
  if (data.action === google.picker.Action.PICKED) {
    showUploadButton.value = true;

    selectedGoogleFiles.value = data.docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      mimeType: doc.mimeType,
      isFolder: doc.mimeType === "application/vnd.google-apps.folder", // Verifica se è una cartella
    }));
  } else if (data.action === google.picker.Action.CANCEL) {
  }
}

async function downloadFileFromGoogleDrive(fileId, accessToken) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.error(`File non trovato: ${fileId}`);
      } else {
        throw new Error(
          `Errore durante il download del file: ${response.status}`
        );
      }
    }

    const fileBlob = await response.blob();
    return fileBlob;

    // Verifica il tipo di contenuto nella risposta
    //   const contentType = response.headers.get('Content-Type');

    // Gestisci la risposta come un'immagine se il tipo di contenuto è quello corretto

    // if (contentType && contentType.startsWith('image/')) {
    //   const blob = await response.blob();
    //   const url = URL.createObjectURL(blob);
    //   const a = document.createElement('a');
    //   a.href = url;
    //   a.download = fileName;  // Usa il nome originale del file
    //   document.body.appendChild(a);
    //   a.click();
    //   document.body.removeChild(a);
    //   URL.revokeObjectURL(url);  // Libera l'URL quando non serve più
    // } else {
    //   console.error('Tipo di file non valido o non riconosciuto:', contentType);
    // }
  } catch (error) {
    console.error("Errore durante il download del file:", error);
    throw error;
  }
}

const props = defineProps({
  mode: {
    type: String,
    default: "create",
  },
  existingClientData: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["clientSaved", "close"]);

const router = useRouter();
const toast = useToast();
const store = useStore();
const token = store.token;

const fiscalCodeExists = ref(props.mode === "update");
const fiscalCodeNotExists = ref(props.mode === "update");
const fiscalCodeChanged = ref(false);
const clientFormFields = ref([]);

const atecoList = ref([]);
const atecoPrimaryList = ref([]);
const atecoSecondaryList = ref([]);

const clientData = ref(
  props.mode === "update"
    ? {
        ...props.existingClientData,
        emails: props.existingClientData.emails || [],
        phones: props.existingClientData.phones || [],
        websites: props.existingClientData.websites || [],
        ibans: props.existingClientData.ibans || [
          { bank_name: "", iban: "", branch: "", import: "" },
        ],
        client_contacts: props.existingClientData.contacts.map((contact) => ({
          id: contact.id,
          name: contact.name || "",
          surname: contact.surname || "",
          phones: contact.phones || [""],
          emails: contact.emails || [""],
          roles: contact.roles || [""],
        })),
        ateco: null,
        ateco_primary: null,
        ateco_secondary: null,
      }
    : {
        fiscal_code: "",
        vat_number: "",
        legal_name: "",
        legal_address: "",
        addresses: [""],
        emails: [],
        phones: [],
        websites: [],
        ibans: [{ bank_name: "", iban: "", branch: "", import: "" }],
        ateco: null,
        ateco_primary: null,
        ateco_secondary: null,
        sector: "",
        company_type: "",
        company_type_other: "",
        type: "",
        type_other: "",
        client_contacts: [],
        annual_billings: [],
        related_clients: [],
        files: [],
        uploadedFiles: [],
      }
);

const isImage = (url) => {
  return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
};

const onFileSelect = async (event) => {
  const file = event.files[0];
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await apiClient.post(
      `${store.api}/clients/${clientData.value.id}/files`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${store.token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const { link, name, message } = response.data;

    clientData.value.files.push({
      link: link,
      name: name,
    });

    toast.add({
      severity: "success",
      summary: "Successo",
      detail: `${message}: ${name}`,
      life: 3000,
    });
  } catch (error) {
    console.error(
      "Error uploading file:",
      error.response?.data?.message || error.message
    );
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: error.response?.data?.message || error.message,
      life: 3000,
    });
  }
};

function validatePrivateFiscalCode(cf) {
  return /^[A-Z]{6}\d{2}[ABCDEHLMPRSTUVWXYZ]\d{2}[A-Z]{1}[A-Z0-9]{3}[A-Z0-9]{1}$/.test(
    cf
  );
}

function validateBusinessFiscalCode(cf) {
  if (cf.length !== 11 || !/^\d+$/.test(cf)) return false;
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    let digit = parseInt(cf[i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

clientFormFields.value = [
  {
    key: "section1",
    type: "separator",
    text: "Sezione 1: Informazioni Primarie",
    class: "col-span-2 mt-4 mb-2 text-lg font-bold text-surface-700",
  },
  {
    key: "fiscal_code",
    label: "Codice fiscale",
    type: "text",
    validation: {
      required: true,
      pattern: /^[A-Z0-9]{16}$|^\d{11}$/,
      validate: (value) => {
        if (/^[A-Z0-9]{16}$/.test(value)) {
          return validatePrivateFiscalCode(value);
        } else if (/^\d{11}$/.test(value)) {
          return validateBusinessFiscalCode(value);
        } else {
          return false;
        }
      },
    },
    error_msg:
      "Il codice fiscale deve essere valido (16 caratteri per privati o 11 numeri per aziende)",
    class: "col-span-2",
    icon: "pi pi-id-card",
  },
  {
    key: "vat_number",
    label: "Partita IVA",
    type: "text",
    error_msg: "La partita IVA è obbligatoria",
    class: "col-span-2",
    icon: "pi pi-copy",
  },
  {
    key: "section2",
    type: "separator",
    text: "Sezione 2: Informazioni Personali",
    class: "col-span-2 mt-4 mb-2 text-lg font-bold text-surface-700",
  },
  {
    key: "legal_name",
    label: "Denominazione sociale",
    validation: { required },
    type: "text",
    error_msg: "La denominazione sociale è obbligatoria",
    icon: "pi pi-info-circle",
  },
  {
    key: "sector",
    label: "Settore",
    type: "select",
    options: store.defaults.sectors,
    error_msg: "Il settore è obbligatorio.",
    icon: "pi pi-chart-pie",
  },
  {
    key: "company_type",
    label: "Tipo di azienda",
    type: "select",
    options: store.defaults.company_types,
    error_msg: "Il tipo di azienda è obbligatorio.",
    icon: "pi pi-building",
  },
  {
    key: "company_type_other",
    label: "Altro tipo di azienda",
    type: "text",
    icon: "pi pi-building",
    class: "hidden",
  },
  {
    key: "type",
    label: "Tipo di cliente",
    type: "select",
    options: store.defaults.client_types,
    error_msg: "Il tipo di cliente è obbligatorio.",
    icon: "pi pi-briefcase",
  },
  {
    key: "type_other",
    label: "Altro tipo di cliente",
    type: "text",
    icon: "pi pi-briefcase",
    class: "hidden",
  },
  ...(props.mode === "update"
    ? [
        {
          key: "company_size",
          label: "Dimensione aziendale",
          type: "select",
          options: store.defaults.size_categories,
          error_msg: "La dimensione aziendale è obbligatoria.",
          icon: "pi pi-chart-bar",
        },
        {
          key: "explanation",
          label: "Spiegazione",
          type: "string",
          icon: "pi pi-info",
        },
      ]
    : []),

  {
    key: "ateco",
    label: "ATECO",
    type: "select",
    class: "col-span-2",
    error_msg: "Il codice ATECO è obbligatorio.",
    icon: "pi pi-hashtag",
  },
  {
    key: "ateco_primary",
    label: "ATECO secondario",
    type: "select",
    placeholder: "Seleziona un ATECO secondario",
    class: "col-span-2",
    hidden: true,
    icon: "pi pi-hashtag",
  },
  {
    key: "ateco_secondary",
    label: "ATECO terziario",
    type: "select",
    placeholder: "Seleziona un ATECO terziario",
    class: "col-span-2",
    hidden: true,
    icon: "pi pi-hashtag",
  },
  {
    key: "section3",
    type: "separator",
    text: "Sezione 3: Informazioni Aggiuntive",
    class: "col-span-2 mt-4 mb-2 text-lg font-bold text-surface-700",
  },
  {
    key: "legal_address",
    label: "Indirizzo (sede legale)",
    type: "text",
    error_msg: "L'indirizzo legale è obbligatorio.",
    class: "col-span-2",
    icon: "pi pi-envelope",
  },
  {
    key: "addresses",
    label: "Indirizzo (sede operativa)",
    type: "text",
    multiple: true,
    size: 1,
    class: "col-span-2",
    icon: "pi pi-envelope",
  },
  {
    key: "emails",
    label: "Email",
    type: "text",
    multiple: true,
    size: 1,
    class: "col-span-2",
    icon: "pi pi-at",
  },
  {
    key: "phones",
    label: "Telefono",
    type: "text",
    multiple: true,
    size: 1,
    validation: {
      required: true,
      pattern: /^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/,
    },
    error_msg:
      "Inserisci un numero di telefono valido (ad es. +39 333 1234567 o +39 011 555 1)",
    class: "col-span-2",
    icon: "pi pi-phone",
  },
  {
    key: "websites",
    label: "Sito Web",
    type: "text",
    multiple: true,
    size: 1,
    class: "col-span-2",
    icon: "pi pi-globe",
  },
  {
    key: "ibans",
    label: "Iban",
    type: "text",
    multiple: true,
    size: 1,
    class: "col-span-2",
  },
  {
    key: "section4",
    type: "separator",
    text: "Sezione 4: Fatturazione Annuale",
    class: "col-span-2 mt-4 mb-2 text-lg font-bold text-surface-700",
  },
  {
    key: "annual_billings",
    label: "Fatturazione Annuale",
    type: "form",
    form: [
      {
        key: "year",
        hidden: true,
      },
      {
        key: "revenue",
        label: "Fatturato",
        type: "text",
        error_msg: "Il fatturato per l'anno scorso è obbligatorio.",
        class: "basis-1/3",
        icon: "pi pi-receipt",
      },
      {
        key: "employee_count",
        label: "Numero Dipendenti",
        type: "text",
        error_msg: "Il numero di dipendenti per l'anno scorso è obbligatorio.",
        class: "basis-1/3",
        icon: "pi pi-user",
      },
      {
        key: "assets",
        label: "Attivo",
        type: "text",
        error_msg: "L'attivo per l'anno scorso è obbligatorio.",
        class: "basis-1/3",
        icon: "pi pi-euro",
      },
    ],
    class: "col-span-2",
  },
  {
    key: "section5",
    type: "separator",
    text: "Sezione 5: Referente aziendale",
    class: "col-span-2 mt-4 mb-2 text-lg font-bold text-surface-700",
  },
  {
    key: "client_contacts",
    label: "Aggiungi referente aziendale",
    type: "button",
    class: "col-span-2",
    icon: "pi pi-plus",
    severity: "success",
    action: () => addContact(),
  },
  {
    key: "section6",
    type: "separator",
    text: "Sezione 6: Le imprese",
    class: "col-span-2 mt-4 mb-2 text-lg font-bold text-surface-700",
  },
  {
    key: "related_clients",
    label: "Aggiungi impresa",
    type: "button",
    class: "col-span-2",
    severity: "success",
    icon: "pi pi-plus",
    action: () => addRelatedClient(),
  },
  ...(props.mode === "update"
    ? [
        {
          key: "section7",
          type: "separator",
          text: "Sezione 7: La visura",
          class: "col-span-2 mt-4 mb-2 text-lg font-bold text-surface-700",
        },
        {
          key: "file",
          type: "upload",
          severity: "success",
          class: "col-span-2",
        },
        {
          key: "section8",
          type: "separator",
          text: "Sezione 8: Parametri dimensionali",
          class: "col-span-2 mt-4 mb-2 text-lg font-bold text-surface-700",
        },
      ]
    : []),
];

watch(
  () => clientData.value.ateco,
  async (newCode) => {
    if (newCode.value || clientData.value.ateco.value !== newCode.value) {
      try {
        const response = await apiClient.get(
          `${store.api}/ateco/${newCode.value}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        atecoPrimaryList.value = response.data.data.map((item) => ({
          value: item.id,
          label: `${item.id} - ${item.description}`,
        }));

        clientFormFields.value.forEach((field) => {
          if (field.key === "ateco_primary") {
            field.options = atecoPrimaryList.value;
            field.hidden = false;
          }

          if (field.key === "ateco_secondary") {
            field.hidden = true;
          }
        });

        const existingPrimary = atecoPrimaryList.value.find(
          (item) => item.value === clientData.value.ateco_primary_code
        );
        if (existingPrimary) {
          clientData.value.ateco_primary = existingPrimary;
        } else {
          clientData.value.ateco_primary = "";
        }

        clientData.value.ateco_secondary = "";
      } catch (error) {
        console.error("Error fetching ATECO primary data:", error);
      }
    }
  }
);

const toggleOtherFieldVisibility = (key, otherKey, newValue) => {
  const otherField = clientFormFields.value.find(
    (field) => field.key === otherKey
  );
  otherField.class =
    newValue === "Altro"
      ? otherField.class.replace("hidden", "").trim()
      : otherField.class.includes("hidden")
      ? otherField.class
      : `${otherField.class} hidden`;
  if (newValue !== "Altro") clientData.value[otherKey] = "";
};

watch(
  () => clientData.value.type,
  (newValue) => toggleOtherFieldVisibility("type", "type_other", newValue)
);
watch(
  () => clientData.value.company_type,
  (newValue) =>
    toggleOtherFieldVisibility("company_type", "company_type_other", newValue)
);

const validateFiscalCodeRelatedClient = (value) => {
  if (/^[A-Z0-9]{16}$/.test(value)) {
    return validatePrivateFiscalCode(value);
  }
  if (/^\d{11}$/.test(value)) {
    return validateBusinessFiscalCode(value);
  }
  return false;
};

const validateLegalNameRelatedClient = (value) => {
  return !!value;
};

const generateValidationRules = () => {
  const rules = {};

  clientFormFields.value.forEach((field) => {
    if (field.validation) rules[field.key] = field.validation;
  });

  rules.company_type_other = {
    $validator: () =>
      clientData.value.company_type !== "Other" ||
      !!clientData.value.company_type_other,
    $message: "Specifica altro tipo di azienda.",
  };

  rules.type_other = {
    $validator: () =>
      clientData.value.type !== "Other" || !!clientData.value.type_other,
    $message: "Specifica altro tipo di cliente.",
  };

  clientData.value.related_clients.forEach((_, index) => {
    const error_msg = `Il codice fiscale per referente ${
      index + 1
    } deve essere valido (16 caratteri per privati o 11 numeri per aziende)`;
    rules[`related_clients.${index}.fiscal_code`] = {
      validateFiscalCodeRelatedClient: helpers.withMessage(error_msg, () =>
        validateFiscalCodeRelatedClient(
          clientData.value.related_clients[index].fiscal_code
        )
      ),
    };
  });

  clientData.value.related_clients.forEach((_, index) => {
    const error_msg = `Il nome legale per referente ${index + 1} è obbligatorio`;
    rules[`related_clients.${index}.legal_name`] = {
      validateLegalNameRelatedClient: helpers.withMessage(error_msg, () =>
        validateLegalNameRelatedClient(
          clientData.value.related_clients[index].legal_name
        )
      ),
    };
  });

  return rules;
};

const rules = generateValidationRules();

let v$ = useVuelidate(rules, clientData);

const checkFiscalCode = async () => {
  if (clientData.value.fiscal_code) {
    try {
      const response = await apiClient.get(
        `${store.api}/clients/check/${clientData.value.fiscal_code}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fiscalCodeNotExists.value = response.status === 404;
      fiscalCodeExists.value = response.status === 200;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        fiscalCodeNotExists.value = true;
        fiscalCodeExists.value = false;
      } else {
        fiscalCodeNotExists.value = false;
        fiscalCodeExists.value = false;
      }
    }
  }
};

const fetchPlaceDetails = async (placeId) => {
  try {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY,
      libraries: ["places", "marker"],
      language: "it",
      region: "IT",
    });

    const Places = await loader.importLibrary("places");
    const service = new Places.PlacesService(document.createElement("div"));

    return new Promise((resolve, reject) => {
      service.getDetails({ placeId }, (result, status) => {
        if (status === Places.PlacesServiceStatus.OK) {
          resolve({
            label: result.formatted_address,
            value: placeId,
          });
        } else {
          reject("Failed to fetch address");
        }
      });
    });
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
};

onMounted(async () => {
  fetchAtecoPrimary();

  if (props.mode === "update") {
    try {
      if (
        Array.isArray(clientData.value.legal_address) &&
        clientData.value.legal_address[0]
      ) {
        const placeDetails = await fetchPlaceDetails(
          clientData.value.legal_address[0]
        );
        if (placeDetails) {
          selectedPlace.value = placeDetails;
        }
      }

      if (
        !Array.isArray(clientData.value.addresses) ||
        clientData.value.addresses.length === 0
      ) {
        clientData.value.addresses = [""];
      } else {
        const fullAddresses = await Promise.all(
          clientData.value.addresses.map(async (placeId) => {
            if (placeId) {
              return await fetchPlaceDetails(placeId);
            }
            return { label: "", value: "" };
          })
        );
        selectedPlacesA.value = fullAddresses.filter(
          (address) => address !== null
        );
      }

      if (clientData.value.type === "Altro") {
        toggleOtherFieldVisibility("type", "type_other", "Altro");
      }

      if (clientData.value.company_type === "Altro") {
        toggleOtherFieldVisibility(
          "company_type",
          "company_type_other",
          "Altro"
        );
      }
    } catch (error) {
      console.error("Error processing addresses:", error);
    }
  }
});

watch(
  () => clientData.value.fiscal_code,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      fiscalCodeChanged.value = true;
      fiscalCodeNotExists.value = false;
      fiscalCodeExists.value = false;
      checkFiscalCode();
    }
  }
);

const copyFiscalCode = () => {
  clientData.value.vat_number = clientData.value.fiscal_code;
};

const getFieldErrorMessage = (fieldKey) => {
  const field = clientFormFields.value.find((f) => f.key === fieldKey);
  return field ? field.error_msg : fieldKey;
};

const submitClient = async () => {
  try {
    const isValid = await v$.value.$validate();
    // const additionalErrors = validateAdditionalFields();

    // if (!isValid || additionalErrors.length > 0) {
    // [...v$.value.$errors, ...additionalErrors].forEach(error => {
    if (!isValid) {
      [...v$.value.$errors].forEach((error) => {
        const errorMessage =
          typeof error === "string"
            ? error
            : getFieldErrorMessage(error.$property);
        toast.add({
          severity: "error",
          summary: "Validation Error",
          detail: `${errorMessage}`,
          life: 3000,
        });
      });
      return;
    }

    let payload = { ...clientData.value };
    payload.ateco = clientData.value.ateco?.value;
    payload.ateco_primary = clientData.value.ateco_primary?.value;
    payload.ateco_secondary = clientData.value.ateco_secondary?.value;
    payload.legal_address = [selectedPlace.value?.value];

    payload.addresses = selectedPlacesA.value?.some(
      (place) => place && place.value
    )
      ? selectedPlacesA.value.map((place) => (place ? place.value : null))
      : undefined;

    payload.ibans = clientData.value.ibans?.filter(
      (iban) => iban.bank_name || iban.iban
    ).length
      ? clientData.value.ibans.filter((iban) => iban.bank_name || iban.iban)
      : undefined;

    payload = Object.fromEntries(
      Object.entries(payload).filter(([_, value]) => {
        if (Array.isArray(value)) {
          return value.some((v) => v !== "" && v != null);
        }
        return value !== "" && value != null;
      })
    );

    if (props.mode === "create") {
      await apiClient.post(`${store.api}/clients`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.add({
        severity: "success",
        summary: "Successo",
        detail: "Cliente creato con successo.",
        life: 3000,
      });
    } else if (props.mode === "update") {
      await apiClient.put(`${store.api}/clients/${clientData.value.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.add({
        severity: "success",
        summary: "Successo",
        detail: "Cliente aggiornato con successo.",
        life: 3000,
      });
    }

    emit("clientSaved");
  } catch (error) {
    console.error(
      "Error saving client:",
      error.response?.data?.message || error
    );
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Operazione fallita. Riprova.",
      life: 3000,
    });
  }
};

const cancelClient = () => {
  emit("close");
  router.push("/clients");
};

const viewExistingClient = () => {
  router.push(`/clients/${clientData.value.fiscal_code}`);
};

const fetchAtecoPrimary = async () => {
  try {
    const response = await apiClient.get(`${store.api}/ateco`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    atecoList.value = response.data.data.map((item) => ({
      value: item.code,
      label: `${item.code} - (${item.primary_codes}) - ${item.description}`,
    }));

    clientFormFields.value.forEach((field) => {
      if (field.key === "ateco") {
        field.options = atecoList.value;
      }
    });

    const existingAteco = atecoList.value.find(
      (item) => item.value === clientData.value.ateco_code
    );
    if (existingAteco) {
      clientData.value.ateco = existingAteco;
    }
  } catch (error) {
    console.error("Error fetching ATECO data:", error);
  }
};

watch(
  () => clientData.value.ateco_primary,
  async (newId) => {
    if (newId && newId.value) {
      try {
        const response = await apiClient.get(
          `${store.api}/ateco/${clientData.value.ateco.value}/${newId.value}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        atecoSecondaryList.value = response.data.data.map((item) => ({
          value: item.code,
          label: `${item.code} - ${item.description}`,
        }));

        clientFormFields.value.forEach((field) => {
          if (field.key === "ateco_secondary") {
            field.options = atecoSecondaryList.value;
            field.hidden = false;
          }
        });

        const existingSecondary = atecoSecondaryList.value.find(
          (item) => item.value === clientData.value.ateco_secondary_code
        );
        if (existingSecondary) {
          clientData.value.ateco_secondary = existingSecondary;
        } else {
          clientData.value.ateco_secondary = "";
        }
      } catch (error) {
        console.error("Error fetching ATECO secondary data:", error);
      }
    }
  }
);

const addAnnualBilling = () => {
  const currentYear = new Date().getFullYear();
  const lastYear = clientData.value.annual_billings.length
    ? clientData.value.annual_billings[
        clientData.value.annual_billings.length - 1
      ].year
    : currentYear;

  if (clientData.value.annual_billings.length < 5) {
    clientData.value.annual_billings.push({
      year: lastYear - 1,
      revenue: null,
      employee_count: null,
      assets: null,
    });
  }

};

const removeYear = (index) => {
  const currentYear = new Date().getFullYear();

  if (
    clientData.value.annual_billings.length > index &&
    clientData.value.annual_billings[index].year !== currentYear - 1
  ) {
    clientData.value.annual_billings.splice(index, 1);
  }
};

const addContact = () => {
  clientData.value.client_contacts.push({
    name: "",
    surname: "",
    phones: [""],
    emails: [""],
    roles: [""],
  });
};

const removeContact = (index) => {
  clientData.value.client_contacts.splice(index, 1);
};

const addPhone = (contactIndex) => {
  clientData.value.client_contacts[contactIndex].phones.push("");
};

const removePhone = (contactIndex, phoneIndex) => {
  clientData.value.client_contacts[contactIndex].phones.splice(phoneIndex, 1);
};

const addEmail = (contactIndex) => {
  clientData.value.client_contacts[contactIndex].emails.push("");
};

const removeEmail = (contactIndex, emailIndex) => {
  clientData.value.client_contacts[contactIndex].emails.splice(emailIndex, 1);
};

const addRole = (contactIndex) => {
  clientData.value.client_contacts[contactIndex].roles.push("");
};

const removeRole = (contactIndex, roleIndex) => {
  clientData.value.client_contacts[contactIndex].roles.splice(roleIndex, 1);
};

const addAddress = () => {
  clientData.value.addresses.push("");
};

const removeAddress = (index) => {
  if (clientData.value.addresses.length > 1) {
    clientData.value.addresses.splice(index, 1);
  }
};

const addIban = () => {
  clientData.value.ibans.push({
    bank_name: "",
    iban: "",
    branch: "",
    import: "",
  });
};

const removeIban = (index) => {
  if (clientData.value.ibans.length > 1) {
    clientData.value.ibans.splice(index, 1);
  }
};

const suggestions = ref([]);
const selectedPlace = ref(null);

const onSelect = (event) => {
  selectedPlace.value = {
    label: event.label,
    place_id: event.place_id,
  };
};

const fetchPlacePredictions = async (event) => {
  const input = event.query;

  if (!input) {
    suggestions.value = [];
    return;
  }

  try {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY,
      libraries: ["places", "marker"],
      language: "it",
      region: "IT",
    });

    const Places = await loader.importLibrary("places");

    const service = new Places.AutocompleteService();

    service.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: "it" },
        types: ["address"],
      },
      (predictions, status) => {
        if (status === Places.PlacesServiceStatus.OK && predictions) {
          suggestions.value = predictions.map((prediction) => ({
            label: prediction.description,
            value: prediction.place_id,
          }));
        } else {
          suggestions.value = [];
        }
      }
    );
  } catch (error) {
    console.error("Error fetching place predictions:", error);
  }
};

const suggestionsA = ref([]);
const selectedPlacesA = ref(
  Array.isArray(clientData.value.addresses) &&
    clientData.value.addresses.length > 0
    ? clientData.value.addresses.map(() => null)
    : []
);

const fetchPlacePredictionsA = async (index) => {
  const input = selectedPlacesA.value[index];

  if (!input) {
    suggestionsA.value[index] = [];
    return;
  }

  try {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY,
      libraries: ["places", "marker"],
      language: "it",
      region: "IT",
    });

    const Places = await loader.importLibrary("places");

    const service = new Places.AutocompleteService();


    service.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: "it" },
        types: ["address"],
      },
      (predictions, status) => {
        if (status === Places.PlacesServiceStatus.OK && predictions) {
          suggestionsA.value[index] = predictions.map((prediction) => ({
            label: prediction.description,
            value: prediction.place_id,
          }));
        } else {
          suggestionsA.value[index] = [];
        }
      }
    );
  } catch (error) {
    console.error("Error fetching place predictions:", error);
  }
};

const onSelectA = (index) => (event) => {
  selectedPlacesA.value[index] = {
    label: event.label,
    place_id: event.place_id,
  };
};

const updateTheRules = () => {
  const rules = generateValidationRules();
  v$ = null;
  v$ = useVuelidate(rules, clientData);
};

const addRelatedClient = () => {
  clientData.value.related_clients.push({
    legal_name: "",
    fiscal_code: "",
    client_exists: false,
    vat_number: "",
    percentage: 0,
    // annual_billings: [{year: currentYear - 1, revenue: null, employee_count: null, assets: null}],
    annual_billings: [],
  });
  updateTheRules();
};

const removeRelatedClient = (index) => {
  clientData.value.related_clients.splice(index, 1);
  updateTheRules();
};

const addRelatedBilling = (relatedIndex) => {
  const currentYear = new Date().getFullYear();
  const lastYear = clientData.value.related_clients[relatedIndex]
    .annual_billings.length
    ? clientData.value.related_clients[relatedIndex].annual_billings.slice(
        -1
      )[0].year
    : currentYear - 1;

  clientData.value.related_clients[relatedIndex].annual_billings.push({
    year: lastYear - 1,
    revenue: null,
    employee_count: null,
    assets: null,
  });
};

const removeRelatedBilling = (relatedIndex, billingIndex) => {
  if (
    clientData.value.related_clients[relatedIndex].annual_billings.length > 1
  ) {
    clientData.value.related_clients[relatedIndex].annual_billings.splice(
      billingIndex,
      1
    );
  } else {
    clientData.value.related_clients[relatedIndex].annual_billings = [];
  }
};

const relatedClientExists = async (fiscalCode, i) => {
  const client = clientData.value.related_clients[i];
  try {
    const { status, data } = await apiClient.get(
      `${store.api}/clients/check/${fiscalCode}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (status === 200) {
      Object.assign(client, {
        client_exists: true,
        vat_number: data.data.vat_number,
        legal_name: data.data.legal_name,
        annual_billings: data.data.annual_billings,
      });
      return;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      client.client_exists = false;
    }
  }
  Object.assign(client, {
    client_exists: false,
    vat_number: "",
    legal_name: "",
    // annual_billings: [{year: currentYear - 1, revenue: null, employee_count: null, assets: null}]
    annual_billings: [],
  });
};

watch(
  () => clientData.value.related_clients.map((client) => client.fiscal_code),
  async (newFiscalCodes, oldFiscalCodes) => {
    for (let i = 0; i < newFiscalCodes.length; i++) {
      if (newFiscalCodes[i] !== oldFiscalCodes[i]) {
        const exists = await relatedClientExists(newFiscalCodes[i], i);
        if (exists) {
          // Implement logic to disable fields and show autofill button
        } else {
          // Enable fields if previously disabled
          // Implement logic to enable fields
        }
      }
    }
  }
);

const duplicateVatNumber = (relatedClient) => {
  relatedClient.vat_number = relatedClient.fiscal_code;
};

const createRelatedClient = (relatedIndex) => {
};

const downloadFile = async () => {
  try {
    const clientId = clientData.value.id;
    const downloadUrl = `${store.api}/clients/${clientId}/download`;

    const response = await apiClient.get(downloadUrl, {
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "archive.zip");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading file:", error);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Impossibile scaricare il file. Riprova.",
      life: 3000,
    });
  }
};
</script>

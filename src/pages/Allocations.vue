<template>
  <div class="flex px-5 pt-5 !mb-0">
    <div class="w-full mx-auto">
      <Card>
        <template #content>
          <TreeTable
            :value="allocations"
            :lazy="true"
            :paginator="true"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            currentPageReportTemplate="Pagina {currentPage} di {totalPages}"
            paginatorPosition="bottom"
            :rows="perPage"
            :first="first"
            :rowsPerPageOptions="[10, 20, 50, 100]"
            :totalRecords="totalRecords"
            :sortField="sortField"
            :sortOrder="sortOrder"
            @page="onPage"
            @sort="onSort"
            removableSort
            scrollHeight="calc(100vh - 350px)"
            :rowHover="true"
            :resizableColumns="true"
            :scrollable="true"
            scrollDirection="both"
            :loading="loading || loadingAllocationModal"
            class="flex flex-col w-full"
          >
            <template #header>
              <div class="header-container">
                <div class="text-xl font-bold">Pratiche</div>
                <div class="flex justify-end gap-4 action-buttons">
                  <Button
                    :label="toggleFilters ? 'Nascondi filtri' : 'Mostra filtri'"
                    @click="toggleFilters = !toggleFilters"
                    icon="pi pi-search"
                    severity="help"
                    class="p-button-primary responsive-button"
                    outlined
                  />
                  <Button
                    v-if="canAllocationsAssign"
                    label="Assegna"
                    @click="showAssignDialog = true"
                    icon="pi pi-link"
                    severity="info"
                    class="p-button-primary responsive-button"
                    outlined
                  />
                  <Button
                    v-if="canAllocationsCreate"
                    label="Aggiungi nuovo"
                    @click="openNewAllocationDialog"
                    icon="pi pi-plus"
                    severity="success"
                    class="p-button-primary responsive-button"
                    outlined
                  />
                </div>
              </div>
            </template>
            <Column field="id" header="Id" sortable>
              <template #filter>
                <InputText
                  v-if="toggleFilters"
                  v-model="filters.id"
                  type="search"
                  class="w-full min-w-20"
                  @input="debouncedFilter(onFilter)"
                  placeholder="ID..."
                />
              </template>
            </Column>
            <Column field="name" header="Nome" sortable>
              <template #filter>
                <InputText
                  v-if="toggleFilters"
                  v-model="filters.name"
                  type="search"
                  @input="debouncedFilter(onFilter)"
                  placeholder="Filtra per nome pratica..."
                />
              </template>
            </Column>
            <Column field="client_name" header="Cliente" sortable>
              <template #filter>
                <InputText
                  v-if="toggleFilters"
                  v-model="filters.client_name"
                  type="search"
                  @input="debouncedFilter(onFilter)"
                  placeholder="Filtra per cliente..."
                />
              </template>
              <template #body="slotProps">
                {{ slotProps.node.data.client?.legal_name }}
              </template>
            </Column>
            <Column field="tender_name" header="Bando" sortable>
              <template #filter>
                <InputText
                  v-if="toggleFilters"
                  v-model="filters.tender_name"
                  type="search"
                  @input="debouncedFilter(onFilter)"
                  placeholder="Filtra per bando..."
                />
              </template>
              <template #body="slotProps">
                {{ slotProps.node.data.tender?.name }}
              </template>
            </Column>
            <Column field="workflow_name" header="Gruppo di fase" sortable>
              <template #filter>
                <InputText
                  v-if="toggleFilters"
                  v-model="filters.workflow_name"
                  type="search"
                  @input="debouncedFilter(onFilter)"
                  placeholder="Filtra per gruppo..."
                />
              </template>
              <template #body="slotProps">
                {{ slotProps.node.data.workflow?.name }}
              </template>
            </Column>
            <Column field="start_date" header="Data inizio" sortable>
              <template #filter>
                <div class="relative inline-block w-full max-w-xs">
                  <DatePicker
                    v-if="toggleFilters"
                    v-model="filters.start_date"
                    dateFormat="dd.mm.yy"
                    placeholder="Filtra per data inizio..."
                    @update:modelValue="onFilter"
                    class="w-full min-w-44"
                  />
                  <button
                    v-if="filters.start_date"
                    @click="clearFilter('start_date')"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-[22px] font-bold text-blue-900"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              </template>
              <template #body="slotProps">
                {{ formatDate(slotProps.node.data.start_date) }}
              </template>
            </Column>
            <Column field="end_date" header="Data fine" sortable>
              <template #filter>
                <div class="relative inline-block w-full max-w-xs">
                  <DatePicker
                    v-if="toggleFilters"
                    v-model="filters.end_date"
                    dateFormat="dd.mm.yy"
                    placeholder="Filtra per data fine..."
                    @update:modelValue="onFilter"
                    class="w-full min-w-44"
                  />
                  <button
                    v-if="filters.end_date"
                    @click="clearFilter('end_date')"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-[22px] font-bold text-blue-900"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              </template>
              <template #body="slotProps">
                {{ formatDate(slotProps.node.data.end_date) }}
              </template>
            </Column>
            <Column header="Azioni">
              <template #body="slotProps">
                <button
                  v-if="canAllocationsView"
                  @click="showAllocation(slotProps.node.key)"
                >
                  <Button type="button" icon="pi pi-eye" severity="info" text />
                </button>
                <button
                  v-if="canAllocationsUpdate"
                  @click="editAllocation(slotProps.node)"
                >
                  <Button
                    type="button"
                    icon="pi pi-pencil"
                    severity="secondary"
                    text
                  />
                </button>
                <button
                  v-if="canAllocationsDelete"
                  @click="confirmDeleteAllocation(slotProps.node)"
                >
                  <Button
                    type="button"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                  />
                </button>
              </template>
            </Column>
            <template #empty>
              <div v-if="allocationMessage">{{ allocationMessage }}</div>
            </template>
            <!--
            <template #paginatorstart>
              <Button type="button" icon="pi pi-refresh" text />
            </template>
            <template #paginatorend>
              <Button type="button" icon="pi pi-download" text />
            </template>
          -->
          </TreeTable>
        </template>
      </Card>
      <br />

      <!-- Add Allocation Dialog -->
      <CreateOrUpdateAllocation
        :isEditing="isEditing"
        :newAllocation="newAllocation"
        :showDialog="showDialog"
        :saving="saving"
        @save="updateOrCreateAllocation"
        @cancel="cancelNewAllocation"
        @reload-allocation="reloadSingleAllocation"
      />

      <Dialog
        :header="currentAllocation?.name"
        v-model:visible="showPhasesDialog"
        :modal="true"
        :closable="true"
        :style="{ width: '78vw' }"
      >
        <template #default>
          <div class="flex gap-4 mb-4 items-center">
            <div
              v-if="
                currentAllocation?.start_date || currentAllocation?.end_date
              "
              class="flex gap-4 align-bottom p-4 w-fit bg-teal-50 rounded-lg"
            >
              <p
                v-if="currentAllocation?.start_date"
                class="flex align-center gap-2"
              >
                <i
                  class="pi pi-calendar-times text-teal-500"
                  style="font-size: 1.5rem"
                ></i>
                <strong>Data inizio:</strong>
                {{ formatDate(currentAllocation.start_date) }}
              </p>
              <p
                v-if="currentAllocation?.end_date"
                class="flex align-center gap-2"
              >
                <i
                  class="pi pi-calendar-times text-teal-500"
                  style="font-size: 1.5rem"
                ></i>
                <strong>Data fine:</strong>
                {{ formatDate(currentAllocation.end_date) }}
              </p>
            </div>

            <Reminder
              v-if="currentAllocation?.end_date && canRemindersManage"
              :entity="currentAllocation"
              :entity_type="'allocations'"
            />
          </div>

          <div class="flex gap-4">
            <div class="w-8/12">
              <div
                v-if="currentAllocation.client"
                class="p-4 rounded-lg border mb-6"
              >
                <div class="text-lg font-semibold">Cliente</div>
                <div class="indent-4 pt-1">
                  <a
                    class="underline"
                    :href="`/clients?details=${currentAllocation.client.fiscal_code}`"
                  >
                    {{ currentAllocation.client.legal_name }}
                  </a>
                </div>
              </div>
              <div
                v-if="currentAllocation.description"
                class="p-4 rounded-lg bg-teal-50 mb-6"
              >
                <div class="text-lg font-semibold">Descrizione</div>
                <div
                  class="indent-4 pt-1"
                  v-html="currentAllocation.description"
                ></div>
              </div>

              <Panel v-if="canFilesView" header="File" toggleable>
                <div class="flex flex-col">
                  <div v-if="currentAllocation.files !== null">
                    <Files
                      :showActions="canFilesDelete"
                      :entityFiles="currentAllocation.files"
                      @reloadFiles="(id) => handleReloadFiles(id)"
                    ></Files>
                  </div>
                  <div class="flex justify-between">
                    <FileUpload
                      v-if="canFilesManage"
                      mode="basic"
                      name="file"
                      :maxFileSize="1000000"
                      :multiple="true"
                      customUpload
                      chooseLabel="Carica altri file"
                      class="p-button-outlined"
                      @select="onFileSelectAllocation"
                      auto
                      severity="secondary"
                    />
                  </div>
                </div>
              </Panel>
              <Panel
                v-if="currentAllocation.participants?.length"
                header="Partecipanti"
                class="mt-6"
                toggleable
              >
                <DataTable
                  :value="currentAllocation.participants"
                  stripedRows
                  responsiveLayout="scroll"
                  scrollable
                  scrollHeight="250px"
                >
                  <Column field="role" header="Ruolo" />
                  <Column field="user_id" header="Utente">
                    <template #body="slotProps">
                      {{ slotProps.data.user.name }}
                    </template>
                  </Column>
                </DataTable>
              </Panel>
            </div>
            <div class="flex flex-col flex-1 gap-4">
              <Notes
                v-if="canNotesView"
                :showEdit="canNotesManage"
                :entity="currentAllocation"
                :entity_type="'Allocation'"
                :entity_download="'allocations'"
                @reloadEntity="showAllocation(currentAllocation.id)"
                class="w-full h-fit"
              />
              <div class="flex justify-center items-center">
                <SplitButton
                  v-if="canAllocationsMop"
                  label="Genera MOP"
                  @click="generateMOP()"
                  :model="mopTypes"
                  outlined
                  :disabled="isMopLoading"
                />
              </div>
            </div>
          </div>
          <div
            class="relative w-full h-[32rem] rounded-lg overflow-hidden mt-6 mb-2"
            v-if="currentAllocation.workflow_data.length > 0"
          >
            <div
              class="absolute inset-0"
              style="
                background-image: radial-gradient(
                  circle at left top,
                  var(--p-surface-500),
                  var(--p-primary-200)
                );
              "
            >
              <div
                class="absolute inset-0 backdrop-blur-2xl bg-black/20 rounded-lg"
              ></div>
            </div>
            <div
              class="relative z-10 h-full w-full overflow-y-auto overflow-x-auto p-4"
            >
              <h2 class="text-white text-md pb-4">
                {{ currentAllocation.workflow.name }}
              </h2>

              <div class="flex gap-4 pb-4 text-white">
                <div
                  v-for="(phase, listIndex) in currentAllocation.workflow_data"
                  :key="phase.value"
                  class="phase-bg bg-black/20 backdrop-blur-md py-1 px-3 h-fit min-w-72 max-w-max inline-block flex-shrink-0 rounded-xl"
                  :class="
                    isPhaseDisabled(listIndex)
                      ? 'opacity-50 pointer-events-none'
                      : ''
                  "
                  @dragover.prevent
                  @drop="onDropCard(listIndex)"
                >
                  <div class="phase-content flex flex-col gap-y-2">
                    <div
                      class="phase-header flex flex-1 items-center justify-between py-2"
                    >
                      <div class="flex items-center gap-2">
                        <div
                          class="first-letter:capitalize indent-4 font-semibold"
                        >
                          {{ phase.name }}
                        </div>
                        <Badge
                          :value="phase.segments.length"
                          severity="primary"
                          size="small"
                          class="opacity-80"
                        >
                        </Badge>
                      </div>

                      <div>
                        <!-- <Reminder
                          :entity="phase"
                          :entity_type="'allocation-phases'"
                        /> -->
                        <!-- <i class="pi pi-ellipsis-v"></i> -->
                        <Button
                          type="button"
                          icon="pi pi-ellipsis-v"
                          @click="(event) => togglePhaseMenu(event, phase.id)"
                          aria-haspopup="true"
                          :aria-controls="`overlay_phase_menu_${phase.id}`"
                          variant="text"
                        />
                        <Menu
                          :ref="(el) => (phaseMenuRefs[phase.id] = el)"
                          :id="`overlay_phase_menu_${phase.id}`"
                          :model="getPhaseMenuItems(phase)"
                          :popup="true"
                        />
                        <Reminder
                          v-if="canRemindersManage"
                          v-show="false"
                          :ref="(el) => (reminderRefs[phase.id] = el)"
                          :entity="phase"
                          :entity_type="'allocation-phases'"
                        />
                      </div>

                      <!--
                      Not requested for now
                      <div>
                        <Button
                          icon="pi pi-trash"
                          class="p-button p-button-text"
                        />
                      </div>
                      -->
                    </div>
                    <div class="phase-segments flex flex-col gap-2 w-full pb-2">
                      <div
                        v-for="(segment, cardIndex) in phase.segments"
                        :key="segment.id"
                        class="segment-bg p-3 w-full bg-black/10 backdrop-blur-md rounded-lg cursor-move"
                        :class="{
                          'border-teal-500 ring-2 ring-teal-500':
                            dragOverListIndex === listIndex &&
                            dragOverCardIndex === cardIndex,
                        }"
                        draggable="true"
                        @dragstart="onDragStart($event, listIndex, cardIndex)"
                        @dragover.prevent="onDragOverCard(listIndex, cardIndex)"
                        @dragleave="onDragLeaveCard"
                        @dragend="onDragEnd($event)"
                      >
                        <div class="flex items-center justify-between mb-2">
                          <div class="flex flex-col gap-1">
                            <div class="flex items-center gap-2">
                              {{ segment.name }} - {{ segment.type }}

                              <div
                                v-if="segment.required"
                                class="h-2 w-2 rounded-full bg-red-600/70 red-shadow ml-2"
                              ></div>
                              <Button
                                v-if="
                                  segment.type === 'string' ||
                                  segment.type === 'text'
                                "
                                icon="pi pi-save"
                                aria-label="Modifica segmento"
                                class="!text-sm !px-0 !py-1"
                                text
                                :disabled="!segment.value"
                                @click="saveSegmentValue(phase, segment)"
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            icon="pi pi-ellipsis-v"
                            @click="
                              (event) => toggleSegmentMenu(event, segment.id)
                            "
                            aria-haspopup="true"
                            :aria-controls="`overlay_menu_${segment.id}`"
                            severity="secondary"
                            variant="text"
                            class="!text-white hover:!bg-[#10b981]"
                          />
                          <Menu
                            :ref="(el) => (segmentMenuRefs[segment.id] = el)"
                            :id="`overlay_menu_${segment.id}`"
                            :model="getSegmentMenuItems(segment, phase)"
                            :popup="true"
                          />
                        </div>
                        <div
                          v-if="segment.type === 'file'"
                          class="flex justify-center pt-2"
                        >
                          <div
                            v-if="segment.value"
                            class="w-[23rem] flex flex-col bg-[#fafcfd] font-semibold text-xs text-surface-600 outline-2 outline outline-[#b2b2b2] rounded-md p-4"
                          >
                            <div
                              class="flex items-center justify-between gap-2"
                            >
                              <div class="flex items-center gap-2">
                                <img
                                  v-if="isImage(segment.value.link)"
                                  :src="segment.value.link"
                                  alt="Preview"
                                  class="w-16 h-16 object-cover"
                                />
                                <div v-else class="flex items-center gap-1">
                                  <i
                                    class="pi pi-file"
                                    style="font-size: 2em"
                                  ></i>
                                  <div class="flex flex-col">
                                    <span>{{ segment.value.name }}</span>
                                    <span class="text-[10px] text-surface-500">
                                      <span v-if="segment.value.link">
                                        {{ segment.value.size }}
                                      </span>
                                      <span v-else>
                                        {{
                                          (segment.value.size / 1024).toFixed(2)
                                        }}
                                        KB
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div class="flex gap-2">
                                <a
                                  v-if="segment.value.link"
                                  :href="segment.value.link"
                                  target="_blank"
                                  class="p-button p-button-outlined p-button-secondary p-mr-2"
                                >
                                  <i class="pi pi-external-link"></i>
                                </a>
                                <a
                                  v-if="segment.value.link"
                                  :href="segment.value.link"
                                  target="_blank"
                                  download
                                  class="p-button p-button-outlined p-button-secondary"
                                >
                                  <i class="pi pi-download"></i>
                                </a>
                                <Button
                                  :disabled="segment.value.link ? false : true"
                                  :icon="
                                    segment.required
                                      ? 'pi pi-undo'
                                      : 'pi pi-trash'
                                  "
                                  class="p-button p-button-outlined p-button-danger"
                                  @click="
                                    segment.required
                                      ? reuploadFile(segment)
                                      : deleteSegmentFile(segment)
                                  "
                                />
                              </div>
                            </div>
                            <div
                              v-if="
                                segment.progress !== undefined &&
                                !segment.value?.link
                              "
                              class="pt-4"
                            >
                              <ProgressBar
                                :value="segment.progress"
                                style="height: 5px"
                              />
                            </div>
                          </div>
                          <div v-else class="flex items-center justify-center">
                            <div
                              class="w-[23rem] p-2 outline-2 rounded-md bg-[#fafcfd] flex items-center justify-center flex-col relative upload-style"
                              :class="
                                dragOverSegmentId === segment.id
                                  ? 'outline-dashed outline-teal-500'
                                  : 'outline outline-[#b2b2b2]'
                              "
                              @dragover.prevent="handleDragOver(segment)"
                              @dragleave.prevent="handleDragLeave"
                              @drop.prevent="
                                (e) => {
                                  handleDrop(), onFileSelect(e, phase, segment);
                                }
                              "
                            >
                              <div
                                v-if="dragOverSegmentId === segment.id"
                                class="absolute inset-0 bg-teal-500/10 pointer-events-none z-10 rounded-md"
                              ></div>
                              <div>
                                <FileUpload
                                  mode="basic"
                                  name="file"
                                  class="!h-8 !w-8 p-button-secondary p-button-raised hide-upload-label mt-1"
                                  chooseIcon="pi pi-cloud-upload"
                                  :auto="false"
                                  :customUpload="false"
                                  @select="
                                    (e) => onFileSelect(e, phase, segment)
                                  "
                                />
                              </div>
                              <div
                                class="mt-2 mb-0 font-semibold text-xs text-surface-600"
                              >
                                Trascina il tuo file qui o sfoglia
                              </div>
                              <div class="text-[10px] text-surface-500">
                                Dimensione max file: 1MB
                              </div>
                              <div
                                v-if="segment.fileTooBig"
                                class="text-[10px] text-red-700 flex items-center gap-x-1 mt-1"
                              >
                                <i
                                  class="pi pi-exclamation-triangle"
                                  style="font-size: 11px"
                                ></i>
                                File troppo grande!
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          v-else-if="segment.type === 'files'"
                          class="flex justify-center pt-2"
                        >
                          <div
                            v-if="segment.value?.length"
                            class="flex flex-col gap-4 pt-2"
                          >
                            <div
                              v-for="file in segment.value"
                              :key="file"
                              class="w-[23rem] flex flex-col bg-[#fafcfd] font-semibold text-xs text-surface-600 outline-2 outline outline-[#b2b2b2] rounded-md p-4"
                            >
                              <div
                                class="flex items-center justify-between gap-2"
                              >
                                <div class="flex items-center gap-2">
                                  <img
                                    v-if="isImage(file.link)"
                                    :src="file.link"
                                    alt="Preview"
                                    class="w-16 h-16 object-cover"
                                  />
                                  <div v-else class="flex items-center gap-1">
                                    <i
                                      class="pi pi-file"
                                      style="font-size: 2em"
                                    ></i>
                                    <div class="flex flex-col">
                                      <span>{{ file.name }}</span>
                                      <span
                                        class="text-[10px] text-surface-500"
                                      >
                                        <span v-if="file.link">
                                          {{ file.size }}
                                        </span>
                                        <span v-else>
                                          {{ (file.size / 1024).toFixed(2) }}
                                          KB
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div class="flex gap-2">
                                  <a
                                    v-if="file.link"
                                    :href="file.link"
                                    target="_blank"
                                    class="p-button p-button-outlined p-button-secondary p-mr-2"
                                  >
                                    <i class="pi pi-external-link"></i>
                                  </a>
                                  <a
                                    v-if="file.link"
                                    :href="file.link"
                                    target="_blank"
                                    download
                                    class="p-button p-button-outlined p-button-secondary"
                                  >
                                    <i class="pi pi-download"></i>
                                  </a>

                                  <Button
                                    :disabled="file.link ? false : true"
                                    :icon="
                                      segment.value?.length === 1 &&
                                      segment.required
                                        ? 'pi pi-undo'
                                        : 'pi pi-trash'
                                    "
                                    class="p-button p-button-outlined p-button-danger"
                                    @click="
                                      segment.value?.length === 1 &&
                                      segment.required
                                        ? reuploadFiles(segment, file)
                                        : deleteSegmentFiles(segment, file)
                                    "
                                  />
                                </div>
                              </div>
                              <div
                                v-if="
                                  segment.progress !== undefined && !file?.link
                                "
                                class="pt-4"
                              >
                                <ProgressBar
                                  :value="segment.progress"
                                  style="height: 5px"
                                />
                              </div>
                            </div>
                          </div>
                          <div v-else class="flex items-center justify-center">
                            <div
                              class="w-[23rem] p-2 outline-2 rounded-md bg-[#fafcfd] flex items-center justify-center flex-col relative upload-style"
                              :class="
                                dragOverSegmentId === segment.id
                                  ? 'outline-dashed outline-teal-500'
                                  : 'outline outline-[#b2b2b2]'
                              "
                              @dragover.prevent="handleDragOver(segment)"
                              @dragleave.prevent="handleDragLeave"
                              @drop.prevent="
                                (e) => {
                                  handleDrop(),
                                    onFilesSelect(e, phase, segment);
                                }
                              "
                            >
                              <div
                                v-if="dragOverSegmentId === segment.id"
                                class="absolute inset-0 bg-teal-500/10 pointer-events-none z-10 rounded-md"
                              ></div>
                              <div>
                                <FileUpload
                                  mode="basic"
                                  name="file"
                                  class="!h-8 !w-8 mt-2 p-button-secondary p-button-raised hide-upload-label"
                                  chooseIcon="pi pi-cloud-upload"
                                  :multiple="true"
                                  :auto="false"
                                  :customUpload="false"
                                  @select="
                                    (e) => onFilesSelect(e, phase, segment)
                                  "
                                />
                              </div>
                              <div
                                class="mt-2 mb-0 font-semibold text-xs text-surface-600"
                              >
                                Trascina i tuoi file qui o sfoglia
                              </div>
                              <div class="text-[10px] text-surface-500">
                                Dimensione max file: 1MB
                              </div>
                            </div>
                          </div>
                        </div>
                        <Editor
                          v-else-if="segment.type === 'text'"
                          v-model="segment.value"
                          class="pt-2 max-w-96"
                        />
                        <ToggleSwitch
                          v-else-if="segment.type === 'bool'"
                          v-model="segment.value"
                          @change="saveSegmentValue(phase, segment)"
                        />
                        <component
                          v-else
                          :is="getComponent(segment.type)"
                          v-model="segment.value"
                          class="mt-2"
                        />
                      </div>

                      <div class="phase-footer">
                        <button
                          class="flex items-center gap-2 text-sm text-white font-semibold bg-transparent hover:bg-[rgba(248,250,252,0.2)] px-3 py-1 rounded transition-colors"
                          @click="openAddSegmentDialog(phase)"
                        >
                          <i class="pi pi-plus" style="font-size: 12px"></i>
                          Aggiungi segmento
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex items-start gap-2 text-white mt-3">
                <div
                  class="h-2 w-2 rounded-full bg-red-600/70 red-shadow mt-1"
                ></div>
                Segmento obbligatorio - completa e salvali tutti per passare
                alla fase successiva
              </div>
            </div>
            <!--
          <div class="w-4/12 bg-teal-50 rounded-l-xl pl-8 py-8 overflow-auto">
            <div class="flex flex-col items-start ml-6">
              <template
                v-for="(phase, index) in currentAllocation.workflow_data"
                :key="phase.value"
              >
                <div
                  class="flex items-center gap-3"
                  :class="{
                    'cursor-pointer': index + 1 != selectedPhase.order,
                  }"
                  @click="
                    index + 1 != selectedPhase.order
                      ? selectPhase(phase.order)
                      : false
                  "
                >
                  <div
                    class="w-8 h-8 rounded-full border-2 bg-white flex items-center justify-center text-lg font-semibold"
                    :class="{
                      'text-teal-500 border-teal-500':
                        phase.order <= selectedPhase.order,
                      'text-[#64748B] border-gray-200':
                        phase.order > selectedPhase.order,
                    }"
                    style="margin-left: -1.25rem"
                  >
                    {{ index + 1 }}
                  </div>
                  <div
                    :class="{
                      'font-medium text-teal-500':
                        phase.order <= selectedPhase.order,
                      'text-[#64748B]': phase.order > selectedPhase.order,
                      '!font-bold': phase.order === selectedPhase.order,
                    }"
                  >
                    {{ phase.name }}
                  </div>
                </div>

                <div
                  v-if="index < currentAllocation.workflow_data.length - 1"
                  class="h-10 border-l-2 -ml-[0.37rem] my-1"
                  :class="{
                    'border-dashed': index + 1 === selectedPhase.order,
                    'border-teal-500': index < selectedPhase.order,
                    'border-gray-200': index >= selectedPhase.order,
                  }"
                ></div>
              </template>
            </div>
          </div>
          <div
            class="w-8/12 bg-gray-50 rounded-r-xl pl-4 flex flex-1 overflow-auto"
          >
            <Stepper :value="selectedPhase.order" class="flex-1">
              <StepItem
                v-for="phase in currentAllocation.workflow_data"
                :key="phase.order"
                :value="phase.order"
                class=""
              >
                <StepPanel v-slot="{ activateCallback }" class="">
                  <div
                    class="flex justify-between items-center sticky top-0 pt-6 pb-5 gap-2 rounded-r-xl bg-gray-50 z-10"
                  >
                    <div class="text-[#64748B] text-xl font-semibold">
                      {{ phase.name }}
                    </div>
                    <div class="flex gap-2">
                      <div class="flex items-center gap-4">
                        <FloatLabel variant="on">
                          <DatePicker
                            id="start_date"
                            dateFormat="yy-mm-dd"
                            v-model="phase.start_date"
                            class="small-dp"
                          />
                          <label for="start_date">Data Inizio</label>
                        </FloatLabel>
                      </div>

                      <div class="flex items-center gap-4">
                        <FloatLabel variant="on">
                          <DatePicker
                            id="end_date"
                            dateFormat="yy-mm-dd"
                            v-model="phase.end_date"
                            class="small-dp"
                          />
                          <label for="end_date">Data Fine</label>
                        </FloatLabel>
                      </div>
                      <div v-if="phase.end_date" class="mr-2">
                        <Button
                          type="button"
                          icon="pi pi-bell"
                          outlined
                          @click="showReminderDialog = true"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4 flex-1 px-4">
                    <div
                      v-for="segment in phase.segments"
                      :key="segment.id"
                      class="mb-6"
                    >
                      <label class="block font-semibold">{{
                        segment.name
                      }}</label>
                      <div
                        v-if="segment.type === 'file'"
                        class="flex flex-col gap-4 items-start"
                      >
                        <div
                          v-if="segment.value"
                          class="mt-2 flex items-center gap-2"
                        >
                          <div class="mr-4">
                            <img
                              v-if="isImage(segment.value.link)"
                              :src="segment.value.link"
                              alt="Preview"
                              class="w-16 h-16 object-cover"
                            />
                            <div v-else class="flex items-center gap-1">
                              <i
                                class="pi pi-file"
                                style="font-size: 1.5em"
                              ></i>
                              <span >{{
                                segment.value.name
                              }}</span>
                            </div>
                          </div>
                          <a
                            :href="segment.value.link"
                            target="_blank"
                            class="p-button p-button-outlined p-button-secondary p-mr-2"
                          >
                            <i class="pi pi-external-link"></i>
                          </a>
                          <a
                            :href="segment.value.link"
                            target="_blank"
                            download
                            class="p-button p-button-outlined p-button-secondary"
                          >
                            <i class="pi pi-download"></i>
                          </a>
                        </div>
                        <FileUpload
                          mode="basic"
                          name="file"
                          class="w-48 h-32 mt-3 upload-border !text-teal-500"
                          chooseLabel="Carica o Cambia"
                          :maxFileSize="1000000"
                          :auto="false"
                          :customUpload="false"
                          @select="(e) => (segment.value = e.files[0])"
                        />
                      </div>
                      <Editor
                        v-else-if="segment.type === 'text'"
                        v-model="segment.value"
                        class="mt-2"
                      />
                      <component
                        v-else
                        :is="getComponent(segment.type)"
                        v-model="segment.value"
                        class="mt-2"
                      />
                    </div>
                  </div>
                  <div
                    class="sticky bottom-0 right-0 flex justify-between pt-2 pb-8 pr-6 gap-2 rounded-r-xl bg-gray-50"
                  >
                    <div>
                      <Button
                        v-if="phase.order > 1"
                        label="Indietro"
                        severity="secondary"
                        @click="
                          activateCallback(phase.order - 1),
                            selectPhase(phase.order - 1)
                        "
                      />
                    </div>
                    <div>
                      <Button
                        label="Salva"
                        @click="saveProgressWorkflow(phase.id)"
                        outlined
                        class="mr-4"
                      />
                      <Button
                        v-if="
                          phase.order < currentAllocation.workflow_data.length
                        "
                        label="Avanti"
                        @click="
                          activateCallback(phase.order + 1),
                            selectPhase(phase.order + 1)
                        "
                      />
                    </div>
                  </div>
                </StepPanel>
              </StepItem>
            </Stepper>
          </div>
          --></div>

          <!--
          <div class="flex justify-end mt-4">
            <Button
              label="Salva"
              severity="success"
              outlined
              icon="pi pi-check"
              class="p-button-primary"
              @click="savePhasesData"
            />
          </div>
        -->
        </template>
      </Dialog>

      <Dialog
        v-model:visible="showAssignDialog"
        :modal="true"
        :style="{ width: '54rem' }"
        header="Pratiche:"
      >
        <InputText
          v-model="searchQuery"
          @input="debouncedFilter(fetchAllocationsQuery)"
          placeholder="Cerca per nome pratica o cliente..."
          class="p-inputtext w-full"
        />
        <div v-if="!filteredAllocations?.length && !loadingQuery" class="py-4">
          Nessun dato trovato con i criteri di ricerca.
        </div>
        <div class="relative min-h-20">
          <div
            v-if="loadingQuery"
            class="absolute inset-0 flex items-start justify-center pt-4 bg-white/50 z-10"
          >
            <ProgressSpinner
              style="width: 50px; height: 50px"
              strokeWidth="4"
            />
          </div>
          <Accordion
            collapseIcon="pi pi-angle-up"
            expandIcon="pi pi-angle-down"
          >
            <AccordionPanel
              v-for="allocation in filteredAllocations"
              :key="allocation.key"
              :value="allocation.key"
            >
              <AccordionHeader>
                <div>
                  {{ allocation.data.name }}
                  <br />
                  <div class="text-xs font-normal mt-1">
                    Cliente: {{ allocation.data.client.legal_name }}
                  </div>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div v-if="allocation.data.participants?.length">
                  <div class="pl-1 pb-4 text-lg font-bold text-surface-400">
                    Partecipanti:
                  </div>
                  <DataTable
                    :value="allocation.data.participants"
                    stripedRows
                    responsiveLayout="scroll"
                    scrollable
                    class="pb-4"
                  >
                    <Column field="role" header="Ruolo" />
                    <Column field="user_id" header="Utente">
                      <template #body="slotProps">
                        {{ slotProps.data.user.name }}
                      </template>
                    </Column>
                    <Column header="Azioni">
                      <template #body="slotProps">
                        <button
                          v-if="canManageParticipant(slotProps.data)"
                          @click="
                            editParticipant(allocation.key, slotProps.data)
                          "
                        >
                          <Button
                            type="button"
                            icon="pi pi-pencil"
                            severity="secondary"
                            text
                          />
                        </button>
                        <button
                          v-if="canManageParticipant(slotProps.data)"
                          @click="
                            confirmDeleteParticipant(
                              allocation.key,
                              slotProps.data
                            )
                          "
                        >
                          <Button
                            type="button"
                            icon="pi pi-trash"
                            severity="danger"
                            text
                          />
                        </button>
                      </template>
                    </Column>
                  </DataTable>
                </div>

                <div>
                  <Button
                    label="Aggiungi partecipanti"
                    icon="pi pi-plus"
                    severity="success"
                    outlined
                    @click="addParticipant(allocation.key)"
                  />
                </div>
              </AccordionContent>
            </AccordionPanel>
          </Accordion>
        </div>
      </Dialog>

      <Dialog
        v-model:visible="showNewOrEditParticipant"
        :modal="true"
        header="Partecipante:"
        class="participant-dialog"
      >
        <div class="flex flex-col justify-between">
          <div class="flex flex-col gap-4 mt-1">
            <div class="flex flex-col gap-2">
              <div v-if="canUsersView" class="flex items-center gap-2">
                <RadioButton
                  v-model="participantType"
                  inputId="registered"
                  value="registered"
                />
                <label for="registered">Utente registrato</label>
              </div>
              <div class="flex items-center gap-2">
                <RadioButton
                  v-model="participantType"
                  inputId="external"
                  value="external"
                />
                <label for="external">Utente esterno</label>
              </div>
            </div>

            <FloatLabel variant="on" class="w-full">
              <Select
                v-model="currentParticipant.role"
                inputId="select_new_role"
                :options="allocationRoles"
                class="w-full"
              />
              <label for="select_new_role">Ruolo</label>
            </FloatLabel>

            <div v-if="canUsersView && participantType === 'registered'">
              <FloatLabel variant="on" class="w-full">
                <Select
                  v-model="currentParticipant.user_id"
                  :options="userOptions"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  class="w-full"
                />
                <label>Utente</label>
              </FloatLabel>
            </div>

            <div
              v-if="participantType === 'external'"
              class="flex flex-col gap-4"
            >
              <FloatLabel variant="on" class="w-full">
                <InputText
                  v-model="currentParticipant.external_name"
                  class="w-full"
                />
                <label>Nome utente esterno</label>
              </FloatLabel>
              <FloatLabel variant="on" class="w-full">
                <InputText
                  v-model="currentParticipant.external_email"
                  type="email"
                  class="w-full"
                />
                <label>Email utente esterno</label>
              </FloatLabel>
            </div>
          </div>

          <div class="flex justify-end mt-4 gap-2">
            <Button
              label="Annulla"
              severity="danger"
              icon="pi pi-times"
              text
              @click="showNewOrEditParticipant = false"
            />
            <Button
              label="Salva"
              severity="success"
              icon="pi pi-check"
              class="p-button-primary"
              @click="
                saveOrUpdateParticipant(currentAllocationId, currentParticipant)
              "
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        v-model:visible="showReminderDialog"
        :modal="true"
        header="Aggiungi promemoria"
      >
        <div class="w-[25rem] pb-4">
          Scegli una data prima della fine della pratica per aggiungere un
          promemoria al calendario
        </div>
        <div class="flex justify-center">
          <DatePicker
            inline
            id="reminder_date"
            dateFormat="yy-mm-dd"
            v-model="reminderDate"
            :minDate="minDate"
            :maxDate="maxDate"
          />
        </div>
        <div class="flex justify-end mt-4">
          <Button
            label="Salva"
            severity="success"
            outlined
            icon="pi pi-check"
            class="p-button-primary"
            @click="saveReminderDate"
          />
        </div>
      </Dialog>

      <Dialog
        v-model:visible="showAddSegmentDialog"
        modal
        header="Aggiungi segmento"
        :style="{ minWidth: '30rem' }"
      >
        <div class="flex flex-col gap-4 mt-1">
          <div class="flex flex-col flex-1 gap-1">
            <FloatLabel variant="on" class="w-full">
              <InputText
                id="segment_name"
                v-model="newSegment.name"
                class="w-full"
                :class="{ 'p-invalid': vNewSegment.name.$error }"
              />
              <label for="segment_name">Nome del nuovo segmento</label>
            </FloatLabel>
            <span
              v-if="vNewSegment.name.$error"
              class="text-red-500 text-sm ml-3"
            >
              {{ vNewSegment.name.$errors[0].$message }}
            </span>
          </div>
          <div class="flex flex-col flex-1 gap-1">
            <FloatLabel class="w-full" variant="on">
              <Select
                v-model="newSegment.type"
                inputId="select_new_segment_type"
                :options="phaseSegmentTypes"
                class="w-full"
                :class="{ 'p-invalid': vNewSegment.type.$error }"
              />
              <label for="select_new_segment_type">Tipo di segmento</label>
            </FloatLabel>
            <span
              v-if="vNewSegment.type.$error"
              class="text-red-500 text-sm ml-3"
            >
              {{ vNewSegment.type.$errors[0].$message }}
            </span>
          </div>

          <div class="flex items-center gap-2 ml-3">
            <label for="required" class="text-[#64748b] font-medium">
              Obbligatorio
            </label>
            <Checkbox
              v-model="newSegment.required"
              binary
              size="large"
              name="required"
            />
          </div>
        </div>

        <div class="flex justify-end mt-4">
          <Button
            label="Salva"
            severity="success"
            outlined
            icon="pi pi-check"
            class="p-button-primary"
            @click="saveNewSegment"
          />
        </div>
      </Dialog>

      <Dialog
        v-model:visible="showEditSegmentDialog"
        modal
        header="Modifica segmento"
        :style="{ minWidth: '30rem' }"
      >
        <div class="flex flex-col gap-4 mt-1">
          <div class="flex flex-col flex-1 gap-1">
            <FloatLabel variant="on" class="w-full">
              <InputText
                id="segment_name"
                v-model="currentSegment.name"
                class="w-full"
                :class="{ 'p-invalid': vCurrentSegment?.name?.$error }"
              />
              <label for="segment_name">Nome del segmento</label>
            </FloatLabel>
            <span
              v-if="vCurrentSegment?.name?.$error"
              class="text-red-500 text-sm ml-3"
            >
              {{ vCurrentSegment?.name?.$errors[0]?.$message }}
            </span>
          </div>
          <div class="flex flex-col flex-1 gap-1">
            <FloatLabel class="w-full" variant="on">
              <Select
                v-model="currentSegment.type"
                inputId="select_new_segment_type"
                :options="phaseSegmentTypes"
                class="w-full"
              />
              <label for="select_new_segment_type">Tipo di segmento</label>
            </FloatLabel>
          </div>

          <div class="flex items-center gap-2 ml-3">
            <label for="required" class="text-[#64748b] font-medium">
              Obbligatorio
            </label>
            <Checkbox
              v-model="currentSegment.required"
              binary
              size="large"
              name="required"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <!-- 
          <Button
            label="Elimina"
            severity="danger"
            outlined
            icon="pi pi-times"
            class="p-button-primary"
            @click="confirmDeleteSegmentDialog = true"
          /> -->
          <Button
            label="Salva"
            severity="success"
            outlined
            icon="pi pi-check"
            class="p-button-primary"
            @click="editSegment"
          />
        </div>
      </Dialog>

      <Dialog
        header="Conferma Eliminazione"
        v-model:visible="confirmDeleteSegmentDialog"
        :style="{ width: '25rem' }"
        modal
      >
        <div class="confirmation-content flex items-center">
          <i
            class="pi pi-exclamation-triangle mr-3"
            style="font-size: 2rem"
          ></i>
          <span>Sei sicuro di voler eliminare il segmento?</span>
        </div>
        <template #footer>
          <Button
            label="No"
            icon="pi pi-times"
            severity="secondary"
            class="p-button-text"
            @click="confirmDeleteSegmentDialog = false"
          />
          <Button
            label="Sì"
            icon="pi pi-check"
            severity="danger"
            @click="deleteSegment"
          />
        </template>
      </Dialog>

      <Dialog
        v-model:visible="showAddDatesSegmentDialog"
        header="Aggiungi date"
        :style="{ width: '25rem' }"
        modal
      >
        <div class="flex flex-col gap-4 mt-1">
          <div class="flex items-center gap-4">
            <FloatLabel variant="on">
              <DatePicker
                id="start_date"
                v-model="startDate"
                dateFormat="dd.mm.yy"
              />
              <label for="start_date">Data Inizio</label>
            </FloatLabel>
            <FloatLabel variant="on">
              <DatePicker
                id="end_date"
                v-model="endDate"
                dateFormat="dd.mm.yy"
              />
              <label for="end_date">Data Fine</label>
            </FloatLabel>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <Button
            label="Salva"
            severity="success"
            outlined
            icon="pi pi-check"
            class="p-button-primary"
            @click="addDatesToSegment"
          />
        </div>
      </Dialog>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref, watch, computed, reactive } from "vue";
import TreeTable from "primevue/treetable";
import Column from "primevue/column";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import ToggleSwitch from "primevue/toggleswitch";
import FileUpload from "primevue/fileupload";
import Editor from "primevue/editor";
import Panel from "primevue/panel";
import Card from "primevue/card";
import { useToast } from "primevue/usetoast";
import { useStore } from "@/store";
import apiClient from "@/router/apiClient";
import { useConfirm } from "primevue/useconfirm";
import apiService from "@/services/apiService";
import { eventBus } from "@/main";
import CreateOrUpdateAllocation from "@/pages/AllocationCreateOrUpdate.vue";
import Notes from "@/components/Notes.vue";
import DataTable from "primevue/datatable";
import Accordion from "primevue/accordion";
import AccordionPanel from "primevue/accordionpanel";
import AccordionHeader from "primevue/accordionheader";
import AccordionContent from "primevue/accordioncontent";
import Select from "primevue/select";
import SplitButton from "primevue/splitbutton";
import FloatLabel from "primevue/floatlabel";
import { useRoute, useRouter } from "vue-router";
import Files from "@/components/Files.vue";
import DatePicker from "primevue/datepicker";
import Menu from "primevue/menu";
import { formatDate, formatDateIso } from "@/utils/dateUtils";
import Badge from "primevue/badge";
import ProgressBar from "primevue/progressbar";
import Checkbox from "primevue/checkbox";
import RadioButton from "primevue/radiobutton";
import useVuelidate from "@vuelidate/core";
import { required, helpers } from "@vuelidate/validators";
import Reminder from "@/components/Reminder.vue";
import ProgressSpinner from "primevue/progressspinner";
import { usePermissions } from "@/composables/usePermissions";

const { can } = usePermissions();

const canAllocationsView = computed(() => can("allocations.view"));
const canAllocationsCreate = computed(() => can("allocations.manage"));
const canAllocationsUpdate = computed(() => can("allocations.manage"));
const canAllocationsDelete = computed(() => can("allocations.full"));
const canAllocationsMop = computed(() => can("allocations.mop"));
const canAllocationsAssign = computed(() => can("allocations.manage"));

const canUsersView = computed(() => can("users.view"));
const canNotesView = computed(() => can("notes.view"));
const canNotesManage = computed(() => can("notes.manage"));
const canRemindersManage = computed(() => can("reminders.manage"));
const canFilesView = computed(() => can("files.view"));
const canFilesManage = computed(() => can("files.manage"));
const canFilesDelete = computed(() => can("files.delete"));

const canManageParticipant = (participant) =>
  canAllocationsDelete.value || participant?.can_manage === true;

const store = useStore();
const allocations = ref([]);
const filters = reactive({
  id: "",
  client_name: "",
  name: "",
  tender_name: "",
  workflow_name: "",
  start_date: null,
  end_date: null,
});
const toggleFilters = ref(true);
const allocationMessage = ref("");
const toast = useToast();
const showDialog = ref(false);
const showPhasesDialog = ref(false);
const isEditing = ref(false);
const currentAllocation = ref(null);
const confirm = useConfirm();
const userOptions = ref([]);
const showAssignDialog = ref(false);
const showNewOrEditParticipant = ref(false);
const allocationRoles = ref(store.defaults.allocation_participant_roles);
const currentParticipant = ref(null);
const currentAllocationId = ref(null);
const participantType = ref("registered");
const searchQuery = ref("");
const startDate = ref("");
const endDate = ref("");
const reminderDate = ref("");
const showReminderDialog = ref(false);
const minDate = ref(null);
const maxDate = ref(null);

const route = useRoute();
const router = useRouter();

const client_id = route.query.client_id || null;
const user_id = route.query.user_id || null;
const urgent = route.query.urgent || null;

const logIdsInput = ref("");

const totalRecords = ref(0);
const perPage = ref(20);
const first = ref(0);
const sortField = ref("id");
const sortOrder = ref(-1);
const loading = ref(false);
const saving = ref(false);
const showAddSegmentDialog = ref(false);
const showEditSegmentDialog = ref(false);
const showAddDatesSegmentDialog = ref(false);
const phases = ref(null);
const selectedPhase = ref(null);
const phaseSegmentTypes = ref([]);
const newSegment = ref({
  name: "",
  type: "",
  required: false,
});

const rulesSegment = {
  name: {
    required: helpers.withMessage(
      "Il nome del segmento è obbligatorio.",
      required
    ),
  },
  type: {
    required: helpers.withMessage(
      "Il tipo del segmento è obbligatorio.",
      required
    ),
  },
};

const vNewSegment = useVuelidate(rulesSegment, newSegment);

const currentSegment = ref(null);

const rulesEditSegment = {
  name: {
    required: helpers.withMessage(
      "Il nome del segmento è obbligatorio.",
      required
    ),
  },
};
const vCurrentSegment = useVuelidate(rulesEditSegment, currentSegment);

const confirmDeleteSegmentDialog = ref(false);
const fileIdToDelete = ref(null);
const MOP_TYPES = [
  { key: "rnd", label: "MODELLO R&D" },
  { key: "saba", label: "MODELLO SABA 5.0" },
];

const selectedMopType = ref(MOP_TYPES[0].key); // "rnd"
const isMopLoading = ref(false);

const mopTypes = computed(() => {
  const items = [];
  MOP_TYPES.forEach((t, idx) => {
    items.push({
      label: `${t.label}${
        selectedMopType.value === t.key ? "\u00A0\u00A0🗸" : ""
      }`,
      command: () => {
        selectedMopType.value = t.key;
        generateMOP(t.key);
      },
    });
    if (idx < MOP_TYPES.length - 1) items.push({ separator: true });
  });
  return items;
});

const segmentMenuRefs = reactive({});

const getSegmentMenuItems = (segment, phase) => {
  const menuItems = [];
  const options = [];

  if (canAllocationsUpdate.value) {
    options.push({
      label: "Modifica",
      icon: "pi pi-pencil",
      command: () => openEditSegmentDialog(phase, segment),
    });
  }

  options.push({
    label: "Aggiungi date",
    icon: "pi pi-calendar",
    command: () => openAddDatesToSegmentDialog(phase, segment),
  });

  if (canAllocationsUpdate.value) {
    options.push({
      label: "Elimina",
      icon: "pi pi-times",
      command: () => openDeleteSegmentDialog(phase, segment),
    });
  }

  menuItems.push({
    label: "Opzioni",
    items: options,
  });

  return menuItems;
};

const toggleSegmentMenu = (event, segmentId) => {
  segmentMenuRefs[segmentId].toggle(event);
};

const phaseMenuRefs = reactive({});
const reminderRefs = ref({});

const getPhaseMenuItems = (phase) => {
  const menuItems = [];
  const options = [
    {
      label: "Aggiungi date",
      icon: "pi pi-calendar",
      command: () => openAddDatesToSegmentDialog(phase, null),
    },
  ];

  if (canRemindersManage.value) {
    options.push({
      label: "Aggiungi promemoria",
      icon: "pi pi-bell",
      command: () => {
        reminderRefs.value[phase.id]?.open();
      },
    });
  }

  menuItems.push({
    label: "Opzioni",
    items: options,
  });

  return menuItems;
};

const togglePhaseMenu = (event, phaseId) => {
  phaseMenuRefs[phaseId].toggle(event);
};

const newAllocation = ref({
  name: "",
  description: "",
  start_date: null,
  end_date: null,
  user_id: store.user,
  client_id: "",
  tender_id: "",
  workflow_id: "",
  workflow_version_id: null,
  participants: [],
});

watch(
  () => currentParticipant?.value?.user_id,
  (newVal) => {
    if (newVal) {
      currentParticipant.value.external_name = null;
      currentParticipant.value.external_email = null;
    }
  }
);

watch(
  () => currentParticipant?.value?.external_name,
  (newVal) => {
    if (newVal) {
      currentParticipant.value.user_id = null;
    }
  }
);
watch(
  () => currentParticipant?.value?.external_email,
  (newEmail) => {
    if (newEmail && !currentParticipant.external_name) {
      currentParticipant.value.user_id = null;
    }
  }
);

const filteredAllocations = ref(null);

const onFilter = () => {
  loading.value = true;
  first.value = 0;
  fetchAllocations();
};

const clearFilter = (key) => {
  filters[key] = null;
  first.value = 0;
  onFilter();
};

const onPage = (event) => {
  loading.value = true;
  if (event.rows !== perPage.value) {
    perPage.value = event.rows;
    first.value = 0;
  } else {
    first.value = event.first;
  }
  fetchAllocations();
};

const onSort = (event) => {
  sortField.value = event.sortField;
  sortOrder.value = event.sortOrder;
  fetchAllocations();
};

const fetchAllocations = async () => {
  const page = Math.floor(first.value / perPage.value) + 1;
  const params = {
    client_id: client_id || null,
    user_id: user_id || null,
    id: filters.id || null,
    client_name: filters.client_name || null,
    name: filters.name || null,
    tender_name: filters.tender_name || null,
    workflow_name: filters.workflow_name || null,
    start_date: formatDateIso(filters.start_date) || null,
    end_date: formatDateIso(filters.end_date) || null,
    per_page: perPage.value,
    page: page,
    by: sortField.value || null,
    desc: sortOrder.value === -1 ? 1 : 0,
    light: 1,
    urgent: urgent || null,
  };

  if (!sortField.value) {
    params.urgent = 1;
  }

  try {
    const response = await apiClient.get(`${store.api}/allocations`, {
      params,
      headers: { Authorization: `Bearer ${store.token}` },
    });
    if (response.data.data.length === 0) {
      allocationMessage.value =
        "Nessun dato sulle pratiche ancora disponibile.";
      allocations.value = [];
    } else {
      allocations.value = response?.data?.data?.map((allocation) => ({
        key: allocation.id,
        data: allocation,
      }));
      totalRecords.value = response.data.meta.total;
    }
  } catch (error) {
    if (error?.response?.status === 403) {
      allocationMessage.value =
        "You don't have permission to view allocations.";
      allocations.value = [];
      totalRecords.value = 0;
      loading.value = false;
      return;
    }

    console.error("Error fetching allocations:", error.message);
  }
  loading.value = false;
};

const loadingQuery = ref(false);
const fetchAllocationsQuery = async () => {
  loadingQuery.value = true;
  const params = {};
  if (searchQuery) {
    params.find = searchQuery.value;
    if (!searchQuery.value) {
      params.urgent = 1;
      params.per_page = 20;
    }
  }

  try {
    const response = await apiClient.get(`${store.api}/allocations`, {
      params,
      headers: { Authorization: `Bearer ${store.token}` },
    });
    if (response.data.data.length === 0) {
      filteredAllocations.value = [];
    } else {
      filteredAllocations.value = response?.data?.data?.map((allocation) => ({
        key: allocation.id,
        data: allocation,
      }));
    }
  } catch (error) {
    console.error("Error fetching allocations:", error.message);
  } finally {
    loadingQuery.value = false;
  }
};

const loadingAllocationModal = ref(false);
onMounted(async () => {
  if (!canAllocationsView.value) {
    toast.add({
      severity: "warn",
      summary: "Not allowed",
      detail: "You don't have permission to view allocations.",
      life: 3000,
    });
    router.replace("/dashboard");
    return;
  }

  if (route.params.id) {
    try {
      await showAllocation(route.params.id);
    } catch (error) {
      console.error("Error fetching allocation by ID:", error.message);
      toast.add({
        severity: "error",
        summary: "Errore",
        detail: "Impossibile caricare i dettagli della pratica",
        life: 3000,
      });
      router.replace({ path: "/allocations", query: route.query });
    }
  }
  loading.value = true;


  if (canUsersView.value) {
    await fetchUsers();
  }

  await fetchAllocations();
  await fetchAllocationsQuery();
  //filteredAllocations.value = allocations.value;
  phaseSegmentTypes.value = store.defaults.phase_segment_types;
});

const isImage = (url) => {
  return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
};

const handleReloadFiles = (fileId) => {
  if (!canFilesDelete.value) return;
  currentAllocation.value.files = currentAllocation.value.files.filter(
    (file) => file.id !== fileId
  );
};

const MAX_FILE_SIZE = 2048 * 1024 * 1024;

const onFileSelectAllocation = async (event) => {
  if (!canFilesManage.value) return;

  const files = event.files;
  const formData = new FormData();

  if (files.length > 0) {
    const originalEvent = event.originalEvent;
    const selectedFiles = originalEvent?.target?.files || [];
    const validFiles = [];
    const invalidFiles = [];

    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(file);
      } else {
        validFiles.push(file);
      }
    }

    if (invalidFiles.length) {
      toast.add({
        severity: "error",
        summary: "Alcuni file erano troppo grandi",
        detail: `Caricamento non riuscito per ${invalidFiles.length} file.`,
        life: 4000,
      });
    }

    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    try {
      const response = await apiClient.post(
        `${store.api}/allocations/${currentAllocation.value.id}/files`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${store.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      response.data.data.forEach((file) => {
        currentAllocation.value.files.push({
          id: file.id,
          link: file.link,
          name: file.name,
        });
      });

      toast.add({
        severity: "success",
        summary: "Successo",
        detail: `Caricamento riuscito per ${validFiles.length} file.`,
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
  }
};

const onFileSelect = async (event, phase, segment) => {
  let file;

  if (event.dataTransfer && event.dataTransfer.files) {
    file = event.dataTransfer.files[0];
  } else if (event.files && event.files.length) {
    file = event.files[0];
  }

  if (!file) return;

  if (file.size > MAX_FILE_SIZE) {
    segment.fileTooBig = true;
    return;
  }

  segment.fileTooBig = false;
  segment.progress = 0;
  segment.value = file;

  if (fileIdToDelete.value) {
    try {
      await apiClient.delete(`${store.api}/files/${fileIdToDelete.value}`, {
        headers: { Authorization: `Bearer ${store.token}` },
      });
      fileIdToDelete.value = null;
    } catch (error) {
      console.error("Error deleting file:", error.message);
      toast.add({
        severity: "error",
        summary: "Errore",
        detail: `Eliminazione del primo file fallita.`,
        life: 3000,
      });
    }
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await apiClient.post(
      `${store.api}/allocations/${currentAllocation.value.id}/phases/${phase.id}/segments/${segment.id}/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${store.token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          segment.progress = percentCompleted;

          if (percentCompleted >= 100) {
            setTimeout(() => {
              segment.progress = undefined;
            }, 1600);
          }
        },
      }
    );

    if (response.data?.data?.value) {
      segment.value = response.data.data.value;
      await showAllocation(currentAllocation.value.id);
    }

    toast.add({
      severity: "success",
      summary: "Successo",
      detail: "File caricato con successo!",
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

const onFilesSelect = async (event, phase, segment) => {
  let files;

  if (event.dataTransfer && event.dataTransfer.files) {
    files = event.dataTransfer.files;
  } else if (event.files && event.files.length) {
    files = event.files;
  }

  if (!files.length) return;

  if (fileIdToDelete.value) {
    try {
      await apiClient.delete(`${store.api}/files/${fileIdToDelete.value}`, {
        headers: { Authorization: `Bearer ${store.token}` },
      });
      fileIdToDelete.value = null;
    } catch (error) {
      console.error("Error deleting file:", error.message);
      toast.add({
        severity: "error",
        summary: "Errore",
        detail: `Eliminazione del primo file fallita.`,
        life: 3000,
      });
    }
  }

  const validFiles = [];
  const invalidFiles = [];


  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      invalidFiles.push(file);
    } else {
      validFiles.push(file);
    }
  }

  if (invalidFiles.length) {
    toast.add({
      severity: "error",
      summary: "Alcuni file erano troppo grandi",
      detail: `Caricamento non riuscito per ${invalidFiles.length} file.`,
      life: 4000,
    });
  }

  segment.progress = 0;
  segment.value.push(...validFiles);

  const formData = new FormData();
  validFiles.forEach((file, index) => {
    formData.append(`files[${index}]`, file);
  });

  try {
    const response = await apiClient.post(
      `${store.api}/allocations/${currentAllocation.value.id}/phases/${phase.id}/segments/${segment.id}/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${store.token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          segment.progress = percentCompleted;

          if (percentCompleted >= 100) {
            setTimeout(() => {
              segment.progress = undefined;
            }, 1600);
          }
        },
      }
    );

    if (response.data?.data?.value) {
      segment.value = response.data.data.value;
      await showAllocation(currentAllocation.value.id);
    }

    toast.add({
      severity: "success",
      summary: "Successo",
      detail: `Caricamento riuscito per ${validFiles.length} file.`,
      life: 3000,
    });
  } catch (error) {
    console.error(
      "Error uploading files:",
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

const openNewAllocationDialog = async () => {
  showDialog.value = true;
  isEditing.value = false;
};
const updateOrCreateAllocation = async () => {
  try {
    saving.value = true;
    const payload = {
      ...newAllocation.value,
      start_date: formatDateIso(newAllocation.value.start_date),
      end_date: formatDateIso(newAllocation.value.end_date),
    };
    const response = await apiService.postOrPutWithAuth(
      `allocations${isEditing.value ? `/${newAllocation.value.id}` : ""}`,
      payload,
      isEditing.value,
      {
        successMessage: isEditing.value
          ? "Pratica aggiornata con successo."
          : "Pratica creata con successo.",
        errorMessage: "Salvataggio della pratica fallito.",
      }
    );

    if (isEditing.value && response.workflow_version_changed) {
      eventBus.emit("toast", {
        severity: "success",
        summary: "Successo",
        detail: "La versione del workflow è cambiata.",
      });
    }

    cancelNewAllocation();
    await fetchAllocations();
  } catch (error) {
    console.error(
      `Error during ${isEditing.value ? "update" : "creation"}:`,
      error.message
    );
  } finally {
    saving.value = false;
  }
};

const cancelNewAllocation = () => {
  showDialog.value = false;
  newAllocation.value = {
    name: "",
    description: "",
    start_date: null,
    end_date: null,
    user_id: "",
    client_id: "",
    tender_id: "",
    workflow_id: "",
    workflow_version_id: null,
    participants: [],
  };
};

const editAllocation = async (allocation) => {
  await fetchSingleAllocation(allocation.key);
  newAllocation.value = {
    id: currentAllocation.value.id,
    client_id: currentAllocation.value.client?.id || null,
    tender_id: currentAllocation.value.tender?.id || null,
    workflow_id: currentAllocation.value.workflow?.id || null,
    workflow_version_id: currentAllocation.value.workflow_version_id || null,
    name: currentAllocation.value?.name || "",
    description: currentAllocation.value?.description || "",
    start_date: currentAllocation.value?.start_date || null,
    end_date: currentAllocation.value?.end_date || null,
    participants: currentAllocation.value?.participants || [],
    notes: currentAllocation.value?.notes || [],
  };
  isEditing.value = true;
  showDialog.value = true;
};

const reloadSingleAllocation = async (allocationId) => {
  await fetchSingleAllocation(allocationId);
  newAllocation.value.notes = currentAllocation.value?.notes || [];
};

const fetchSingleAllocation = async (allocationId) => {
  loadingAllocationModal.value = true;
  try {
    currentAllocation.value = await apiService.getWithAuth(
      `allocations/${allocationId}`
    );
  } catch (error) {
    console.error("Error showing allocation details:", error.message);
  } finally {
    loadingAllocationModal.value = false;
  }
};

const showAllocation = async (allocationId) => {
  router.push(`/allocations/allocation-details/${allocationId}`);

  //loadingAllocationModal.value = true;
  // try {
  //   currentAllocation.value = await apiService.getWithAuth(
  //     `allocations/${allocationId}`
  //   );
  //   if (currentAllocation.value.workflow) {
  //     currentAllocation.value.workflow_data.forEach((phase) => {
  //       phase.segments.forEach((segment) => {
  //         if (segment.type === "file" || segment.type === "files") {
  //           segment.progress = 0;
  //           segment.fileTooBig = false;
  //         }
  //         if (
  //           (segment.value && segment.type !== "files") ||
  //           (segment.type === "files" && segment?.value?.length)
  //         ) {
  //           segment.saved = true;
  //         }
  //       });
  //       phases.value = currentAllocation.value.workflow_data;
  //     });
  //   }
  //showPhasesDialog.value = true;
  //   updateUrlForAllocation(allocationId);
  // } catch (error) {
  //   console.error("Error showing allocation details:", error.message);
  // } finally {
  //   loadingAllocationModal.value = false;
  // }
};

const savePhasesData = async () => {
  try {
    await apiService.postOrPutWithAuth(
      `allocations/${currentAllocation.value.id}/upload`,
      currentAllocation.value.workflow_data,
      false,
      {
        successMessage: "Dati delle fasi salvati con successo.",
        errorMessage: "Errore durante il salvataggio dei dati delle fasi.",
      }
    );
  } catch (error) {
    console.error("Error saving phases data:", error.message);
  }
};

const saveNewSegment = async () => {
  try {
    const isValid = await vNewSegment.value.$validate();
    if (!isValid) return;

    const response = await apiClient.post(
      `${store.api}/allocations/${currentAllocation.value.id}/phases/${selectedPhase.value.id}/segments`,
      newSegment.value,
      {
        headers: { Authorization: `Bearer ${store.token}` },
      }
    );
    if (response.data) {
      showAddSegmentDialog.value = false;
      toast.add({
        severity: "success",
        summary: "Successo",
        detail: "Segmento aggiunto con successo!",
        life: 3000,
      });
      await showAllocation(currentAllocation.value.id);
    }
  } catch (error) {
    console.error(
      "Error adding segment:",
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

const saveSegmentValue = async (phase, segment) => {
  try {
    const response = await apiClient.post(
      `${store.api}/allocations/${currentAllocation.value.id}/phases/${phase.id}/segments/${segment.id}/submit`,
      { value: segment.value ? segment.value : "false" },
      {
        headers: { Authorization: `Bearer ${store.token}` },
      }
    );
    if (response.data) {
      toast.add({
        severity: "success",
        summary: "Successo",
        detail: "Valore del segmento salvato con successo!",
        life: 3000,
      });
      await showAllocation(currentAllocation.value.id);
    }
  } catch (error) {
    console.error(
      "Error saving segment value:",
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

const editSegment = async () => {
  try {
    const isValid = await vCurrentSegment.value.$validate();
    if (!isValid) return;

    const response = await apiClient.put(
      `${store.api}/allocations/${currentAllocation.value.id}/phases/${selectedPhase.value.id}/segments/${currentSegment.value.id}`,
      currentSegment.value,
      {
        headers: { Authorization: `Bearer ${store.token}` },
      }
    );
    if (response.data) {
      showEditSegmentDialog.value = false;
      toast.add({
        severity: "success",
        summary: "Successo",
        detail: "Segmento modificato con successo!",
        life: 3000,
      });
      await showAllocation(currentAllocation.value.id);
    }
  } catch (error) {
    console.error(
      "Error editing segment:",
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

const addDatesToSegment = async () => {
  if (startDate.value || endDate.value) {
    if (
      startDate.value &&
      endDate &&
      new Date(endDate.value) < new Date(startDate.value)
    ) {
      toast.add({
        severity: "warn",
        summary: "Attenzione",
        detail: "La data di fine deve essere successiva alla data di inizio.",
        life: 3000,
      });
      return;
    }
    currentSegment.value.start_date = formatDateIso(startDate.value) || null;
    currentSegment.value.end_date = formatDateIso(endDate.value) || null;
  }
  toast.add({
    severity: "warn",
    summary: "Attenzione",
    detail: "Aggiornamento fallito",
    life: 3000,
  });
  showAddDatesSegmentDialog.value = false;
};
const deleteSegment = async () => {
  try {
    const response = await apiClient.delete(
      `${store.api}/allocations/${currentAllocation.value.id}/phases/${selectedPhase.value.id}/segments/${currentSegment.value.id}`,
      {
        headers: { Authorization: `Bearer ${store.token}` },
      }
    );
    if (response.data) {
      confirmDeleteSegmentDialog.value = false;
      showEditSegmentDialog.value = false;
      toast.add({
        severity: "success",
        summary: "Successo",
        detail: "Segmento eliminato con successo!",
        life: 3000,
      });
      await showAllocation(currentAllocation.value.id);
    }
  } catch (error) {
    console.error(
      "Error deleting segment:",
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

const serializePhase = (phase) => {
  const form = new FormData();

  form.append(`id`, phase.id);


  if (phase.start_date) form.append(`start_date`, phase.start_date);
  if (phase.end_date) form.append(`end_date`, phase.end_date);

  phase.segments.forEach((segment, segIndex) => {
    const prefix = `segments[${segIndex}]`;

    form.append(`${prefix}[id]`, segment.id);

    if (segment.type === "file" && segment.value instanceof File) {
      form.append(`${prefix}[value]`, segment.value);
    } else {
      form.append(`${prefix}[value]`, segment.value ?? "");
    }
  });

  return form;
};

const saveProgressWorkflow = async (id) => {
  try {
    const fullForm = new FormData();
    fullForm.append("_method", "PUT");

    currentAllocation.value.workflow_data.forEach((phase, index) => {
      const partialForm = serializePhase(phase, index);

      for (let [key, value] of partialForm.entries()) {
        fullForm.append(key, value);
      }
    });

    const status = await apiService.postOrPutWithAuth(
      `allocations/${currentAllocation.value.id}/phase/${id}`,
      fullForm,
      false,
      {
        successMessage: "Fase e segmenti salvati con successo.",
        errorMessage: "Errore durante il salvataggio.",
      }
    );
    if (status.data) {
      currentAllocation.value.workflow_data[id] = status.data;
    }
  } catch (error) {
    console.error("Error updating phase:", error.message);
  }
};

// const saveProgressWorkflow = async () => {

// try {
//   await apiService.postOrPutWithAuth(
//     `allocations/${currentAllocation.value.id}/upload`,
//     currentAllocation.value.workflow_data,
//     false,
//     {
//       successMessage: "Dati delle fasi salvati con successo.",
//       errorMessage: "Errore durante il salvataggio dei dati delle fasi.",
//     }
//   );
// } catch (error) {
//   console.error("Error saving phases data:", error.message);
// }
// };

const saveReminderDate = async () => {
  // try {
  //   await apiService.postOrPutWithAuth(
  //     `allocations/${currentAllocation.value.id}/upload`,
  //     currentAllocation.value.workflow_data,
  //     false,
  //     {
  //       successMessage: "Dati delle fasi salvati con successo.",
  //       errorMessage: "Errore durante il salvataggio dei dati delle fasi.",
  //     }
  //   );
  // } catch (error) {
  //   console.error("Error saving phases data:", error.message);
  // }
};

const getComponent = (type) => {
  switch (type) {
    case "file":
      return FileUpload;
    case "files":
      return FileUpload;
    case "text":
      return Editor;
    case "string":
      return InputText;
    case "bool":
      return ToggleSwitch;
    default:
      return InputText;
  }
};

const confirmDeleteAllocation = (allocation) => {
  confirm.require({
    message: "Sei sicuro di voler eliminare questa pratica?",
    header: "Conferma eliminazione",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    rejectClass: "p-button-secondary",
    acceptLabel: "Sì",
    rejectLabel: "Annulla",
    accept: () => {
      deleteAllocation(allocation);
    },
  });
};

const deleteAllocation = async (allocation) => {
  try {
    const status = await apiService.deleteWithAuth(
      "allocations",
      allocation.key,
      {
        successMessage: "Pratica eliminata con successo!",
        errorMessage: "Eliminazione della pratica fallita.",
      }
    );
    if (status === 200) {
      await fetchAllocations();

      if (
        showPhasesDialog.value &&
        currentAllocation.value?.id === allocation.key
      ) {
        showPhasesDialog.value = false;
        updateUrlForAllocation();
      }
    }
  } catch (error) {
    console.error("Error deleting allocation:", error.message);
  }
};

const submitAllocation = async () => {
  const isValid = await v$.value.$validate();
  if (!isValid) {
    toast.add({
      severity: "error",
      summary: "Errore di validazione",
      detail: "Per favore, correggi gli errori prima di procedere.",
      life: 3000,
    });
    return;
  }

  try {
    const endpoint = `allocations${
      isEditing.value ? `/${newAllocation.value.id}` : ""
    }`;
    const method = isEditing.value ? "put" : "post";
    await apiService[method](endpoint, newAllocation.value, {
      successMessage: isEditing.value
        ? "Pratica aggiornata con successo!"
        : "Pratica creata con successo!",
    });

    toast.add({
      severity: "success",
      summary: "Successo",
      detail: "Operazione completata con successo.",
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: "Operazione fallita. Riprova.",
      life: 3000,
    });
  }
};

const cancelAllocation = () => {
  newAllocation.value = {
    name: "",
    description: "",
    start_date: null,
    end_date: null,
    client_id: null,
    tender_id: null,
    workflow_id: null,
  };
};

const fetchUsers = async () => {
  try {
    userOptions.value = await apiService.getWithAuth("users", {
      transform: (data) =>
        data
          .filter((user) => user.status)
          .map((user) => ({
            label: `${user.name}${
              user.internal_code ? " - " + user.internal_code : ""
            }`,
            value: user.id,
            roles: user.roles,
          })),
    });
    checkRole();
  } catch (error) {
    console.error("Error fetching users:", error.message);
  }
};

function sanitizeFilePart(input) {
  if (!input) return "";
  return String(input)
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .slice(0, 80);
}

function buildMopFileName(typeKey) {
  const typeLabel = MOP_TYPES.find((t) => t.key === typeKey)?.label || typeKey;

  const clientName = currentAllocation.value?.client?.legal_name || "CLIENT";
  const allocationId = currentAllocation.value?.id || "ID";
  const allocationName = currentAllocation.value?.name || "ALLOCATION";

  const parts = [
    sanitizeFilePart(typeLabel),
    sanitizeFilePart(clientName),
    sanitizeFilePart(allocationId),
    sanitizeFilePart(allocationName),
  ].filter(Boolean);

  return `${parts.join("-")}.xlsm`;
}

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

const generateMOP = async (type = selectedMopType.value) => {
  if (isMopLoading.value) return;
  isMopLoading.value = true;

  toast.add({
    severity: "info",
    summary: "Download",
    detail: `Generazione MOP avviata (${
      MOP_TYPES.find((t) => t.key === type)?.label || type
    })…`,
    life: 2000,
  });

  try {
    const endpoint = `${store.api}/allocations/${currentAllocation.value.id}/mop`;

    const response = await apiClient.get(endpoint, {
      params: { type },
      responseType: "blob",
      headers: { Authorization: `Bearer ${store.token}` },
    });

    downloadBlob(response.data, buildMopFileName(type));
  } catch (error) {
    console.error("Error generating MOP:", error?.response?.data || error);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: error?.response?.data?.message || "Impossibile generare MOP",
      life: 3000,
    });
  } finally {
    isMopLoading.value = false;
  }
};

const getUserLabel = (userId) => {
  const user = userOptions.value.find((u) => u.value === userId);
  return user ? user.label : "";
};

const addParticipant = (allocationId) => {
  showNewOrEditParticipant.value = true;
  currentAllocationId.value = allocationId;
  participantType.value = canUsersView.value ? "registered" : "external";
  currentParticipant.value = {
    role: "",
    user_id: "",
    external_name: "",
  };
};

const editParticipant = (allocationId, participant) => {
  if (!canManageParticipant(participant)) return;

  showNewOrEditParticipant.value = true;
  currentAllocationId.value = allocationId;
  currentParticipant.value = { ...participant };
  participantType.value = participant.user_id ? "registered" : "external";
};

const confirmDeleteParticipant = (allocationId, participant) => {
  confirm.require({
    message: "Sei sicuro di voler eliminare questo partecipante?",
    header: "Conferma eliminazione",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    rejectClass: "p-button-secondary",
    acceptLabel: "Sì",
    rejectLabel: "Annulla",
    accept: () => {
      deleteParticipant(allocationId, participant.id);
    },
  });
};

// Save or update participant
const saveOrUpdateParticipant = (allocationId, participant) => {
  if (participant.id) {
    updateParticipant(allocationId, participant.id, participant);
  } else {
    createParticipant(allocationId, participant);
  }
};

// Create participant
const createParticipant = (allocationId, participant) => {
  if (!validateParticipant(participant)) return;

  saving.value = true;
  apiClient
    .post(
      `${store.api}/allocations/${allocationId}/participants`,
      participant,
      { headers: { Authorization: `Bearer ${store.token}` } }
    )
    .then(async () => {
      currentAllocationId.value = null;
      showNewOrEditParticipant.value = false;
      saving.value = false;
      await fetchAllocationsQuery();
      toast.add({
        severity: "success",
        summary: "Partecipante creato",
        detail: "Il partecipante è stato aggiunto con successo.",
        life: 3000,
      });
    })
    .catch((error) => handleApiError(error));
};

const updateParticipant = (allocationId, participantId, participant) => {
  if (!validateParticipant(participant)) return;

  saving.value = true;

  apiClient
    .put(
      `${store.api}/allocations/${allocationId}/participants/${participantId}`,
      participant,
      { headers: { Authorization: `Bearer ${store.token}` } }
    )
    .then(async () => {
      currentAllocationId.value = null;
      showNewOrEditParticipant.value = false;
      saving.value = false;
      await fetchAllocationsQuery();
      toast.add({
        severity: "success",
        summary: "Partecipante aggiornato",
        detail: "Il partecipante è stato aggiornato con successo.",
        life: 3000,
      });
    })
    .catch((error) => handleApiError(error));
};

// Delete participant
const deleteParticipant = (allocationId, participantId) => {
  apiClient
    .delete(
      `${store.api}/allocations/${allocationId}/participants/${participantId}`,
      { headers: { Authorization: `Bearer ${store.token}` } }
    )
    .then(async () => {
      await fetchAllocationsQuery();
      toast.add({
        severity: "success",
        summary: "Partecipante eliminato",
        detail: "Il partecipante è stato eliminato con successo.",
        life: 3000,
      });
    })
    .catch((error) => handleApiError(error));
};

// Validate participant data
const validateParticipant = (participant) => {
  if (!participant.role) {
    toast.add({
      severity: "warn",
      summary: "Errore di Validazione",
      detail: "Il ruolo del partecipante è obbligatorio.",
      life: 3000,
    });
    return false;
  }

  if (!participant.user_id && !participant.external_name) {
    toast.add({
      severity: "warn",
      summary: "Errore di Validazione",
      detail: "L'utente o il nome esterno del partecipante è obbligatorio.",
      life: 3000,
    });
    return false;
  }

  if (participant.external_name && !participant.external_email) {
    toast.add({
      severity: "warn",
      summary: "Errore di Validazione",
      detail: "L'email del partecipante è obbligatorio.",
      life: 3000,
    });
    return false;
  }

  if (participant.external_email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(participant.external_email)) {
      toast.add({
        severity: "warn",
        summary: "Errore di Validazione",
        detail: "Inserisci un indirizzo email valido.",
        life: 3000,
      });
      return false;
    }
  }

  return true;
};

// Handle API error
const handleApiError = (error) => {
  console.error("Error during the API request:", error.response || error);
  toast.add({
    severity: "error",
    summary: "Errore di server",
    detail: "Si è verificato un errore interno del server. Riprova più tardi.",
    life: 3000,
  });
};

const updateUrlForAllocation = (allocationId = null) => {
  if (allocationId) {
    router.replace({
      path: `/allocations/${allocationId}`,
      query: route.query,
    });
  } else {
    router.replace({ path: "/allocations", query: route.query });
  }
};

watch(showPhasesDialog, (newValue) => {
  if (!newValue) {
    updateUrlForAllocation();
  }
});

function selectPhase(order) {
  selectedPhase.value = currentAllocation.value.workflow_data.find(
    (phase) => phase.order === order
  );
}

function openAddSegmentDialog(phase) {
  selectedPhase.value = phase;
  newSegment.value = {
    name: "",
    type: "",
    required: null,
  };
  vNewSegment.value.$reset();
  showAddSegmentDialog.value = true;
}

function openEditSegmentDialog(phase, segment) {
  selectedPhase.value = phase;
  currentSegment.value = { ...segment };
  vCurrentSegment.value.$reset();
  showEditSegmentDialog.value = true;
}

function openAddDatesToSegmentDialog(phase, segment) {
  selectedPhase.value = phase;
  currentSegment.value = { ...segment };
  showAddDatesSegmentDialog.value = true;
}

function openDeleteSegmentDialog(phase, segment) {
  selectedPhase.value = phase;
  currentSegment.value = { ...segment };
  confirmDeleteSegmentDialog.value = true;
}

const dragOverSegmentId = ref(null);

function handleDragOver(segment) {
  dragOverSegmentId.value = segment.id;
}

function handleDragLeave() {
  dragOverSegmentId.value = null;
}

function handleDrop() {
  dragOverSegmentId.value = null;
  dragOverCardIndex.value = null;
  dragOverListIndex.value = null;
}

function reuploadFiles(segment, fileToDelete) {
  fileIdToDelete.value = fileToDelete.id;
  segment.value = segment.value.filter((file) => file !== fileToDelete);
}

function reuploadFile(segment) {
  fileIdToDelete.value = segment.value.id;
  segment.value = null;
}

async function deleteSegmentFile(segment) {
  await deleteFile(segment.value.id);
  segment.value = null;
}

async function deleteSegmentFiles(segment, fileToDelete) {
  await deleteFile(fileToDelete.id);
  segment.value = segment.value.filter((file) => file !== fileToDelete);
}

function isSegmentCompleted(segment) {
  if (segment.saved) return true;
  else return false;
}

const firstInvalidPhaseIndex = computed(() => {
  return currentAllocation.value.workflow_data.findIndex((phase) =>
    phase.segments.some(
      (segment) => segment.required && !isSegmentCompleted(segment)
    )
  );
});

function isPhaseDisabled(index) {
  return (
    firstInvalidPhaseIndex.value !== -1 && index > firstInvalidPhaseIndex.value
  );
}

const deleteFile = async (fileId) => {
  if (!canFilesDelete.value) return;

  try {
    await apiClient.delete(`${store.api}/files/${fileId}`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });

    await showAllocation(currentAllocation.value.id);
    toast.add({
      severity: "success",
      summary: "Successo",
      detail: `File eliminato con successo!`,
      life: 3000,
    });
  } catch (error) {
    console.error("Error deleting file:", error.message);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: `Eliminazione del file fallita.`,
      life: 3000,
    });
  }
};

// Local drag state
let draggedSegment = null;
let fromListIndex = null;
let fromCardIndex = null;
let toCardIndex = null;

const dragOverCardIndex = ref(null);
const dragOverListIndex = ref(null);

function onDragStart(e, listIndex, cardIndex) {
  draggedSegment = phases.value[listIndex].segments[cardIndex];
  fromListIndex = listIndex;
  fromCardIndex = cardIndex;
  toCardIndex = null;

  const dragImage = e.target.cloneNode(true);

  //dragImage.style.opacity = "1";
  dragImage.style.backgroundColor = "rgba(255, 255, 255, 1)"; // Ensure a solid background
  // // dragImage.style.backdropFilter = "none";
  // //dragImage.style.WebkitBackdropFilter = "none";
  dragImage.style.width = e.target.offsetWidth + "px";
  // dragImage.style.transform = "none";
  // dragImage.style.transition = "none";
  // dragImage.style.filter = "none";
  // dragImage.style.zIndex = "9999";

  // 3. Position the clone off-screen temporarily
  dragImage.style.position = "absolute";
  dragImage.style.top = "-9999px";
  dragImage.style.left = "-9999px";
  document.body.appendChild(dragImage);

  // 4. Set the custom drag image with fixed offsets (centered is good)
  const centerX = e.target.offsetWidth / 2;
  const centerY = e.target.offsetHeight / 2;
  e.dataTransfer.setDragImage(dragImage, centerX, centerY);

  // Store the cloned drag image for cleanup in dragend
  e.dataTransfer.customDragImage = dragImage;
}

// onDragEnd remains the same for cleanup:
function onDragEnd(e) {
  e.target.style.opacity = ""; // Reset original element opacity

  // Remove the custom drag image clone from the DOM
  if (e.dataTransfer.customDragImage) {
    e.dataTransfer.customDragImage.remove();
    e.dataTransfer.customDragImage = null; // Clean up the reference
  }
}

function onDragOverCard(listIndex, cardIndex) {
  dragOverCardIndex.value = cardIndex;
  dragOverListIndex.value = listIndex;
  toCardIndex = cardIndex;
}

function onDragLeaveCard() {
  dragOverCardIndex.value = null;
  dragOverListIndex.value = null;
}

function onDragOverEmptySpace(listIndex) {
  dragOverCardIndex.value = null;
  dragOverListIndex.value = listIndex;
  toCardIndex = null;
}

async function onDropCard(toListIndex) {
  if (
    draggedSegment === null ||
    fromListIndex === null ||
    fromCardIndex === null
  )
    return;

  const fromList = phases.value[fromListIndex];
  const toList = phases.value[toListIndex];

  const originalFromListIndex = fromListIndex;
  const originalFromCardIndex = fromCardIndex;
  const originalToCardIndex = toCardIndex;

  // Remove from original list
  fromList.segments.splice(fromCardIndex, 1);

  // Calculate the insert index for the new list
  let insertIndex = toCardIndex !== null ? toCardIndex : toList.segments.length;

  //CHECK THIS PART FOR THE SAME LIST
  // Adjust index if moving within the same list and dropping after the original position

  // if (
  //   fromListIndex === toListIndex &&
  //   originalToCardIndex !== null &&
  //   insertIndex > originalFromCardIndex
  // ) {
  //   insertIndex -= 1;
  // }

  // Insert into new list
  toList.segments.splice(insertIndex, 0, draggedSegment);

  if (draggedSegment.order === insertIndex + 1 && fromList.id === toList.id) {
    draggedSegment = null;
    fromListIndex = null;
    fromCardIndex = null;
    toCardIndex = null;
    dragOverCardIndex.value = null;
    dragOverListIndex.value = null;
    return;
  }
  try {
    const payload = {
      order: insertIndex + 1,
      phase_id: toList.id,
    };

    const response = await apiClient.put(
      `${store.api}/allocations/${currentAllocation.value.id}/phases/${fromList.id}/segments/${draggedSegment.id}/move`,
      payload,
      {
        headers: { Authorization: `Bearer ${store.token}` },
      }
    );
    if (response.data) {
      toast.add({
        severity: "success",
        summary: "Successo",
        detail: "Segmento spostato con successo!",
        life: 3000,
      });
      await showAllocation(currentAllocation.value.id);
    }
  } catch (error) {
    console.error(
      "Error moving segment:",
      error.response?.data?.message || error.message
    );
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: error.response?.data?.message || error.message,
      life: 3000,
    });
  }

  // Reset
  draggedSegment = null;
  fromListIndex = null;
  fromCardIndex = null;
  toCardIndex = null;
  dragOverCardIndex.value = null;
  dragOverListIndex.value = null;
}

let filterTimeout = null;

const debouncedFilter = (onFilter) => {
  if (filterTimeout) {
    clearTimeout(filterTimeout);
  }
  filterTimeout = setTimeout(() => {
    onFilter();
  }, 1000);
};
</script>

<style>
.p-fileupload-advanced {
  border: none !important;
}

.done .p-step-number {
  border-color: #bbf7d0 !important;
  color: #22c55e !important;
}

@media screen and (max-width: 900px) {
  .action-buttons {
    flex-direction: column;
    align-items: flex-end;
    width: 100%;
    gap: 0.5rem !important;
  }

  .responsive-button {
    width: auto;
    font-size: 0.85rem;
    padding: 0.4rem 0.6rem !important;
  }

  .responsive-button .p-button-label {
    font-size: 0.85rem;
  }

  .responsive-button .p-button-icon {
    font-size: 0.85rem;
  }
}

@media screen and (max-width: 640px) {
  .action-buttons {
    align-items: stretch;
  }

  .responsive-button {
    width: 100%;
    justify-content: flex-start;
  }
}

@media screen and (max-width: 500px) {
  .header-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .action-buttons {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem !important;
  }

  .responsive-button {
    width: auto;
    padding: 0.5rem !important;
  }

  .responsive-button .p-button-label {
    display: none;
  }

  .responsive-button .p-button-icon {
    margin-right: 0;
    font-size: 1rem;
  }
}

.p-selectbutton .p-togglebutton:first-child {
  border-left-width: 1px;
  border-top-left-radius: var(--p-selectbutton-border-radius);
  border-top-right-radius: var(--p-selectbutton-border-radius);
  border-bottom-left-radius: 0px !important;
}

.p-selectbutton .p-togglebutton:last-child {
  border-top-right-radius: 0px !important;
  border-bottom-left-radius: var(--p-selectbutton-border-radius);
  border-bottom-right-radius: var(--p-selectbutton-border-radius);
}

.p-selectbutton {
  min-height: 64px;
}

.p-togglebutton-checked {
  min-height: 40px;
}

.p-togglebutton-label {
  line-height: 34px;
}

.upload-border {
  background-color: #f0fdfa !important;
  background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%2314B8A6FF' stroke-width='4' stroke-dasharray='16%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e") !important;
  border: 0px !important;
}

.p-steppanel {
  transition: none !important;
  animation: none !important;
}

.p-stepitem:last-of-type .p-steppanel {
  padding-inline-start: 0px !important;
}

.text-shadow {
  text-shadow: -1.5px 0.5px #14b8a6;
}

.hide-upload-label .p-button-label {
  display: none;
}

.p-fileupload.p-fileupload-basic.p-component > span {
  display: none;
}

.p-progressbar-label {
  display: none !important;
}

.p-fileupload .p-message {
  display: none !important;
}

.red-shadow {
  box-shadow: 0 0 8px 3px rgba(255, 0, 0, 0.6);
}

.p-button-icon-only {
  width: 2rem !important;
}

.participant-dialog {
  min-width: 30rem;
}

@media (max-width: 640px) {
  .participant-dialog {
    width: 95vw !important;
    min-width: unset;
  }
}
</style>

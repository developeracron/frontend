<template>
  <div class="px-5">
    <div class="mb-3">
      <a :href="'/allocations'" class="text-sm leading-[22px] text-[#000000D9]">
        <i
          class="pi pi-arrow-left"
          style="font-size: 11px; line-height: 24px; padding-right: 5px"
        ></i>
        Torna indietro
      </a>
    </div>
    <div v-if="isLoading" class="flex items-center justify-center w-full h-72">
      <ProgressSpinner />
    </div>
    <div v-else-if="notFound" class="text-center">
      <i class="pi pi-exclamation-triangle"></i>
      Pratica con il id <b>{{ route.params.id }}</b> non è stata trovata.
    </div>
    <div v-else>
      <div class="flex items-center justify-between pb-2">
        <div class="text-xl text-[#000000E0] font-bold leading-8">
          {{ currentAllocation?.name }}
          <i
            v-if="canAllocationsUpdate"
            class="pi pi-pencil ml-2 cursor-pointer"
            @click="editAllocation"
          ></i>
        </div>
        <div>
          <SplitButton
            v-if="canAllocationsMop"
            icon="pi pi-download"
            label="Genera MOP"
            @click="generateMOP()"
            :model="mopTypes"
            size="small"
            :disabled="isMopLoading"
          />
        </div>
      </div>
      <div
        class="flex items-center gap-2 font-semibold text-lg leading-6 text-[#00000040]"
      >
        <div>
          ID:
          {{ currentAllocation?.id }}
        </div>
        <div v-if="currentAllocation?.description">-</div>
        <div v-html="currentAllocation?.description"></div>
      </div>
      <div class="py-6">
        <hr />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-4">
        <aside class="first-col col-span-1">
          <div
            class="flex items-center gap-2 text-lg font-semibold leading-6 text-[#000000E0]"
          >
            <i class="pi pi-user"></i>
            <a
              :href="`/clients?details=${currentAllocation?.client?.fiscal_code}`"
            >
              {{ currentAllocation?.client?.legal_name }}
            </a>
          </div>
          <div class="py-6">
            <hr />
          </div>
          <div>
            <div
              class="flex items-center gap-2 text-lg font-semibold leading-6 text-[#000000E0] pb-3"
            >
              <i class="pi pi-calendar"></i>
              Scadenze
            </div>
            <div class="flex gap-4 items-center">
              <div
                v-if="
                  currentAllocation?.start_date || currentAllocation?.end_date
                "
                class="flex gap-4 rounded-sm border py-[5px] px-3 text-sm"
              >
                <p>
                  {{ formatDate(currentAllocation.start_date) || "∞" }}
                </p>
                <div>
                  <i
                    class="pi pi-arrow-right text-surface-400"
                    style="font-size: 12px"
                  ></i>
                </div>
                <p>
                  {{ formatDate(currentAllocation.end_date) || "∞" }}
                </p>
                <div>
                  <i
                    class="pi pi-calendar text-surface-400"
                    style="font-size: 12px"
                  ></i>
                </div>
              </div>

              <Reminder
                v-if="currentAllocation?.end_date && canRemindersManage"
                :entity="currentAllocation"
                :entity_type="'allocations'"
              />
            </div>
          </div>
          <div class="py-6">
            <hr />
          </div>
          <div v-if="currentAllocation?.participants?.length">
            <div>
              <div
                class="flex items-center gap-2 text-lg font-semibold leading-6 text-[#000000E0] pb-3"
              >
                <i class="pi pi-users"></i>
                Partecipanti
              </div>
              <div class="flex gap-4 items-center flex-1">
                <DataTable
                  :value="currentAllocation?.participants"
                  stripedRows
                  responsiveLayout="scroll"
                  scrollable
                  scrollHeight="250px"
                  class="w-full"
                >
                  <Column field="role" header="Ruolo" />
                  <Column field="user_id" header="Utente">
                    <template #body="slotProps">
                      {{ slotProps.data.user.name }}
                    </template>
                  </Column>
                </DataTable>
              </div>
            </div>
            <div class="py-6">
              <hr />
            </div>
          </div>

          <div>
            <Notes
              v-if="canNotesView"
              :showEdit="canNotesManage"
              :entity="currentAllocation"
              :entity_type="'Allocation'"
              :entity_download="'allocations'"
              @reloadEntity="reloadSingleAllocation(currentAllocation.id)"
              class="w-full h-fit"
            />
          </div>
          <div class="py-6">
            <hr />
          </div>
          <div v-if="canFilesView">
            <div class="flex flex-col">
              <div
                class="flex items-center gap-2 text-lg font-semibold leading-6 text-[#000000E0] pb-3"
              >
                <i class="pi pi-file"></i>
                File
              </div>
              <div
                v-if="currentAllocation?.files.length"
                class="max-h-[400px] overflow-auto"
              >
                <Files
                  :showActions="canFilesDelete"
                  :entityFiles="currentAllocation?.files"
                  @reloadFiles="(id) => handleReloadFiles(id)"
                ></Files>
              </div>
              <div v-else class="text-sm">Nessun file allegato</div>
              <div v-if="canFilesManage" class="flex justify-between pt-2">
                <div
                  class="min-h-[152px] w-full bg-[#00000005] border border-dashed border-[#D9D9D9] rounded-md flex items-center justify-center flex-col relative upload-style"
                  :class="dragOver ? 'outline-dashed outline-teal-500' : ''"
                  @dragover="onDragOver"
                  @dragleave="onDragLeave"
                  @drop="onDrop"
                >
                  <i
                    class="pi pi-inbox text-teal-500"
                    style="font-size: 28px"
                  ></i>
                  <div class="my-2 text-sm text-[#000000E0]">
                    Trascina qui i tuoi file
                  </div>
                  <FileUpload
                    mode="basic"
                    name="file"
                    :multiple="true"
                    customUpload
                    chooseLabel="Carica"
                    chooseIcon="pi pi-upload !text-[12px]"
                    class="p-button-outlined p-button-secondary !text-sm !bg-white !px-4 !py-[6px]"
                    @select="onFileSelectAllocation"
                    auto
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>
        <main class="second-col md:col-span-2">
          <div
            class="flex items-center gap-2 text-lg font-semibold leading-6 text-[#000000E0]"
          >
            <i class="pi pi-book"></i>
            {{
              currentAllocation?.workflow?.name ||
              currentAllocation?.tender?.name
            }}
          </div>
          <div
            class="text-sm leading-6 text-[#FF4D4F] pb-6"
            v-if="currentAllocation?.workflow_data.length > 0"
          >
            * Segmento obbligatorio
          </div>
          <div
            class="relative w-full rounded-md mb-2"
            v-if="currentAllocation?.workflow_data.length > 0"
          >
            <div class="flex flex-col gap-4 pb-4 text-[#000000E0]">
              <div
                v-for="(phase, listIndex) in currentAllocation?.workflow_data"
                :key="phase.value"
                class="phase-bg bg-[#11BCAC0F] border border-dashed backdrop-blur-md p-6 h-fit min-w-72 w-full inline-block flex-shrink-0 rounded-md"
                @dragover.prevent
                @drop="onDropCard(listIndex)"
              >
                <div class="phase-content flex flex-col gap-y-2">
                  <div
                    class="phase-header flex flex-1 items-center justify-between pb-2"
                  >
                    <div class="flex items-center gap-2">
                      <div
                        @click="togglePhaseSegments(phase.id)"
                        class="cursor-pointer select-none"
                      >
                        <i
                          class="pi"
                          :class="
                            isPhaseOpen(phase.id)
                              ? 'pi-chevron-down'
                              : 'pi-chevron-right'
                          "
                        ></i>
                      </div>
                      <div
                        class="first-letter:capitalize font-semibold text-lg"
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
                      <div
                        v-if="phase.start_date || phase.end_date"
                        class="flex items-center mt-1 gap-2 text-[11px] py-1 px-2 border border-teal-300 rounded-md bg-white w-fit font-semibold"
                      >
                        <i class="pi pi-calendar" style="font-size: 10px"></i>
                        <div>{{ formatDate(phase?.start_date) || "∞" }}</div>
                        <div>
                          <i
                            class="pi pi-arrow-right"
                            style="font-size: 10px"
                          ></i>
                        </div>
                        <div>{{ formatDate(phase?.end_date) || "∞" }}</div>
                      </div>
                    </div>

                    <div>
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
                        :parent="currentAllocation"
                        :parent_type="'allocations'"
                      />
                    </div>
                  </div>
                  <div
                    v-show="isPhaseOpen(phase.id)"
                    class="phase-segments flex flex-col gap-2 w-full pb-2"
                    :class="
                      isPhaseDisabled(listIndex)
                        ? 'opacity-50 pointer-events-none'
                        : ''
                    "
                  >
                    <div
                      v-for="segment in phase.segments"
                      :key="segment.id"
                      class="segment-bg p-3 w-full bg-[#11BCAC0A] border border-dashed backdrop-blur-md rounded-md"
                    >
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex flex-col gap-1">
                          <div class="flex items-center gap-2">
                            <div class="text-[17px] font-semibold">
                              <span
                                v-if="segment.required"
                                class="text-[#FF4D4F]"
                                >* </span
                              >{{ segment.name }} - {{ segment.type }}
                            </div>

                            <Button
                              v-if="
                                segment.type === 'string' ||
                                segment.type === 'text'
                              "
                              icon="pi pi-save"
                              aria-label="Modifica segmento"
                              class="!text-sm !px-0 !py-1"
                              text
                              :disabled="isEmptyValue(segment.value)"
                              @click="saveSegmentValue(phase, segment)"
                            />
                          </div>
                          <div
                            v-if="segment.start_date || segment.end_date"
                            class="flex items-center mt-1 gap-2 text-[11px] py-1 px-2 border border-teal-300 rounded-md bg-teal-50 w-fit font-semibold"
                          >
                            <i
                              class="pi pi-calendar"
                              style="font-size: 10px"
                            ></i>
                            <div>
                              {{ formatDate(segment?.start_date) || "∞" }}
                            </div>
                            <div>
                              <i
                                class="pi pi-arrow-right"
                                style="font-size: 10px"
                              ></i>
                            </div>
                            <div>
                              {{ formatDate(segment?.end_date) || "∞" }}
                            </div>
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
                          variant="text"
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
                          class="w-full flex flex-col bg-[#fafcfd] font-semibold text-xs text-surface-600 outline-2 outline outline-[#b2b2b2] rounded-md p-4"
                        >
                          <div class="flex items-center justify-between gap-2">
                            <div class="flex items-center gap-2">
                              <!-- Miniature disabilitate perché richiederebbero autenticazione -->
                              <!-- TODO: Implementare caricamento miniature tramite blob URL autenticato -->
                              <div class="flex items-center gap-1">
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
                              <Button
                                v-if="
                                  segment.value.link &&
                                  isPreviewable(segment.value)
                                "
                                icon="pi pi-external-link"
                                class="p-button p-button-outlined p-button-secondary p-mr-2"
                                @click="openPreview(segment.value)"
                              />
                              <Button
                                icon="pi pi-eye"
                                class="p-button p-button-outlined p-button-secondary"
                                @click="preview.open(segment.value)"
                              />
                              <Button
                                v-if="segment.value.link"
                                icon="pi pi-download"
                                class="p-button p-button-outlined p-button-secondary"
                                @click="downloadFile(segment.value)"
                              />
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
                        <div
                          v-else
                          class="w-full flex items-center justify-center"
                        >
                          <div
                            class="w-full p-4 border border-dashed border-[#D9D9D9] rounded-md bg-[#fafcfd] flex items-center justify-center flex-col relative upload-style"
                            :class="
                              dragOverSegmentId === segment.id
                                ? 'outline-dashed outline-teal-500'
                                : ''
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
                              class="absolute inset-0 pointer-events-none z-10 rounded-md"
                            ></div>
                            <i
                              class="pi pi-inbox text-teal-500"
                              style="font-size: 28px"
                            ></i>
                            <div class="my-2 text-sm text-[#000000E0]">
                              Trascina qui i tuoi file
                            </div>
                            <div
                              v-if="segment?.fileTooBig"
                              class="text-[10px] text-red-700 flex items-center gap-x-1 my-1"
                            >
                              <i
                                class="pi pi-exclamation-triangle"
                                style="font-size: 11px"
                              ></i>
                              File troppo grande!
                            </div>
                            <div>
                              <FileUpload
                                mode="basic"
                                name="file"
                                chooseLabel="Carica"
                                chooseIcon="pi pi-upload !text-[12px]"
                                class="p-button-outlined p-button-secondary !text-sm !bg-white !px-4 !py-[6px]"
                                auto
                                :customUpload="false"
                                @select="(e) => onFileSelect(e, phase, segment)"
                              />
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
                          class="w-full flex flex-col gap-4 pt-2"
                        >
                          <div
                            v-for="file in segment.value"
                            :key="file"
                            class="w-full flex flex-col bg-[#fafcfd] font-semibold text-xs text-surface-600 outline-2 outline outline-[#b2b2b2] rounded-md p-4"
                          >
                            <div
                              class="flex items-center justify-between gap-2"
                            >
                              <div class="flex items-center gap-2">
                                <!-- Miniature disabilitate perché richiederebbero autenticazione -->
                                <div class="flex items-center gap-1">
                                  <i
                                    class="pi pi-file"
                                    style="font-size: 2em"
                                  ></i>
                                  <div class="flex flex-col">
                                    <span>{{ file.name }}</span>
                                    <span class="text-[10px] text-surface-500">
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
                                <Button
                                  v-if="file.link && isPreviewable(file)"
                                  icon="pi pi-external-link"
                                  class="p-button p-button-outlined p-button-secondary p-mr-2"
                                  @click="openPreview(file)"
                                />
                                <Button
                                  icon="pi pi-eye"
                                  class="p-button p-button-outlined p-button-secondary"
                                  @click="preview.open(file)"
                                />
                                <Button
                                  v-if="file.link"
                                  icon="pi pi-download"
                                  class="p-button p-button-outlined p-button-secondary"
                                  @click="downloadFile(file)"
                                />

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
                          <div class="flex justify-center">
                            <FileUpload
                              mode="basic"
                              name="file"
                              chooseLabel="Carica di più"
                              chooseIcon="pi pi-upload !text-[12px]"
                              class="p-button-outlined p-button-secondary !text-sm !bg-white !px-4 !py-[6px]"
                              :multiple="true"
                              auto
                              :customUpload="false"
                              @select="(e) => onFilesSelect(e, phase, segment)"
                            />
                          </div>
                        </div>
                        <div
                          v-else
                          class="w-full flex items-center justify-center"
                        >
                          <div
                            class="w-full p-4 border border-dashed border-[#D9D9D9] rounded-md bg-[#fafcfd] flex items-center justify-center flex-col relative upload-style"
                            :class="
                              dragOverSegmentId === segment.id
                                ? 'outline-dashed outline-teal-500'
                                : ''
                            "
                            @dragover.prevent="handleDragOver(segment)"
                            @dragleave.prevent="handleDragLeave"
                            @drop.prevent="
                              (e) => {
                                handleDrop(), onFilesSelect(e, phase, segment);
                              }
                            "
                          >
                            <div
                              v-if="dragOverSegmentId === segment.id"
                              class="absolute inset-0 pointer-events-none z-10 rounded-md"
                            ></div>
                            <i
                              class="pi pi-inbox text-teal-500"
                              style="font-size: 28px"
                            ></i>
                            <div class="my-2 text-sm text-[#000000E0]">
                              Trascina qui i tuoi file
                            </div>
                            <FileUpload
                              mode="basic"
                              name="file"
                              chooseLabel="Carica"
                              chooseIcon="pi pi-upload !text-[12px]"
                              class="p-button-outlined p-button-secondary !text-sm !bg-white !px-4 !py-[6px]"
                              :multiple="true"
                              auto
                              :customUpload="false"
                              @select="(e) => onFilesSelect(e, phase, segment)"
                            />
                          </div>
                        </div>
                      </div>
                      <Editor
                        v-else-if="segment.type === 'text'"
                        v-model="segment.value"
                        class="pt-2 w-full"
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
                        class="mt-2 w-full"
                      />
                    </div>

                    <div class="phase-footer mt-2">
                      <Button
                        label="Aggiungi segmento"
                        type="button"
                        icon="pi pi-plus"
                        @click="openAddSegmentDialog(phase)"
                        size="small"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <div
        v-if="loadingAllocation"
        class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
      >
        <ProgressSpinner />
      </div>
    </div>
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
      <div
        v-if="saving"
        class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
      >
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
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
      <div
        v-if="saving"
        class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
      >
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      </div>
    </Dialog>

    <Dialog
      header="Conferma Eliminazione"
      v-model:visible="confirmDeleteSegmentDialog"
      :style="{ width: '25rem' }"
      modal
    >
      <div class="confirmation-content flex items-center">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem"></i>
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
      <div
        v-if="saving"
        class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
      >
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      </div>
    </Dialog>

    <Dialog
      v-model:visible="showAddDatesSegmentDialog"
      header="Aggiungi date"
      :style="{ width: '30rem' }"
      modal
    >
      <div class="flex flex-col gap-4 mt-1">
        <div class="flex items-center gap-4">
          <FloatLabel variant="on">
            <DatePicker
              id="start_date"
              v-model="startDate"
              dateFormat="dd.mm.yy"
              :class="{
                'border-amber-400': phaseDateWarnings.some(
                  (w) => w.field === 'start_date' || w.field === 'both'
                ),
              }"
            />
            <label for="start_date">Data Inizio</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <DatePicker
              id="end_date"
              v-model="endDate"
              dateFormat="dd.mm.yy"
              :class="{
                'border-amber-400': phaseDateWarnings.some(
                  (w) => w.field === 'end_date' || w.field === 'both'
                ),
              }"
            />
            <label for="end_date">Data Fine</label>
          </FloatLabel>
        </div>

        <div
          v-for="(warning, index) in phaseDateWarnings"
          :key="index"
          class="flex items-start gap-2 px-3 py-2 text-sm text-amber-800 bg-amber-50 border border-amber-300 rounded-md"
        >
          <i
            class="pi pi-exclamation-triangle text-amber-600 mt-0.5"
            style="font-size: 14px"
          ></i>
          <span>{{ warning.message }}</span>
        </div>

        <div
          v-if="currentSegment && selectedPhase"
          class="flex items-start gap-2 px-3 py-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-md"
        >
          <i
            class="pi pi-info-circle text-blue-600 mt-0.5"
            style="font-size: 12px"
          ></i>
          <div>
            <div class="font-semibold mb-1">
              Date della fase "{{ selectedPhase.name }}":
            </div>
            <div class="flex gap-2">
              <span v-if="selectedPhase.start_date">{{
                formatDate(selectedPhase.start_date)
              }}</span>
              <i
                v-if="selectedPhase.start_date && selectedPhase.end_date"
                class="pi pi-arrow-right"
                style="font-size: 10px"
              ></i>
              <span v-if="selectedPhase.end_date">{{
                formatDate(selectedPhase.end_date)
              }}</span>
              <span
                v-if="!selectedPhase.start_date && !selectedPhase.end_date"
                class="italic opacity-60"
                >Nessuna data impostata</span
              >
            </div>
          </div>
        </div>

        <div
          v-else-if="!currentSegment && currentAllocation"
          class="flex items-start gap-2 px-3 py-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-md"
        >
          <i
            class="pi pi-info-circle text-blue-600 mt-0.5"
            style="font-size: 12px"
          ></i>
          <div>
            <div class="font-semibold mb-1">Date della pratica:</div>
            <div class="flex gap-2">
              <span v-if="currentAllocation.start_date">{{
                formatDate(currentAllocation.start_date)
              }}</span>
              <i
                v-if="
                  currentAllocation.start_date && currentAllocation.end_date
                "
                class="pi pi-arrow-right"
                style="font-size: 10px"
              ></i>
              <span v-if="currentAllocation.end_date">{{
                formatDate(currentAllocation.end_date)
              }}</span>
              <span
                v-if="
                  !currentAllocation.start_date && !currentAllocation.end_date
                "
                class="italic opacity-60"
                >Nessuna data impostata</span
              >
            </div>
          </div>
        </div>

        <div
          v-if="!currentSegment && currentAllocation?.tender"
          class="flex items-start gap-2 px-3 py-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md"
        >
          <i
            class="pi pi-book text-green-600 mt-0.5"
            style="font-size: 12px"
          ></i>
          <div>
            <div class="font-semibold mb-1">Date del bando:</div>
            <div class="flex gap-2">
              <span v-if="currentAllocation.tender.start_date">{{
                formatDate(currentAllocation.tender.start_date)
              }}</span>
              <i
                v-if="
                  currentAllocation.tender.start_date &&
                  currentAllocation.tender.end_date
                "
                class="pi pi-arrow-right"
                style="font-size: 10px"
              ></i>
              <span v-if="currentAllocation.tender.end_date">{{
                formatDate(currentAllocation.tender.end_date)
              }}</span>
              <span
                v-if="
                  !currentAllocation.tender.start_date &&
                  !currentAllocation.tender.end_date
                "
                class="italic opacity-60"
                >Nessuna data impostata</span
              >
            </div>
          </div>
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
      <div
        v-if="saving"
        class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
      >
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      </div>
    </Dialog>

    <Notes
      v-if="canNotesManage"
      :showEdit="canNotesManage"
      v-show="false"
      :entity="selectedPhase"
      :entity_type="'AllocationPhase'"
      @reloadEntity="reloadSingleAllocation(currentAllocation.id)"
      ref="phaseNotesRef"
    />

    <Dialog
      v-model:visible="showAddNoteToPhaseDialog"
      :modal="true"
      :style="{ width: '30rem' }"
      header="Nuova nota:"
    >
      <div class="w-full flex justify-end flex-col">
        <div class="w-full m flex flex-col">
          <Textarea v-model="newNote" rows="8" cols="30" class="mb-5" />
          <div class="min-h-0 max-h-32 overflow-y-auto">
            <div
              class="flex justify-between items-center mb-4"
              v-for="(file, index) in phaseNoteFiles"
              :key="index"
            >
              <div class="flex items-center gap-2 min-w-0">
                <i
                  class="pi pi-file flex-shrink-0"
                  style="font-size: 1.5em"
                ></i>

                <span class="break-file-name">
                  {{ file?.name ? file.name : file?.title }}
                </span>
              </div>

              <div class="flex gap-2">
                <Button
                  icon="pi pi-eye"
                  class="p-button p-button-outlined p-button-secondary"
                  @click="preview.open(file)"
                />
                <Button
                  v-if="file.id"
                  icon="pi pi-download"
                  class="p-button p-button-outlined p-button-secondary"
                  @click="downloadFile(file)"
                />
                <Button
                  icon="pi pi-trash"
                  class="p-button p-button-outlined p-button-danger"
                  @click="removeNoteFile(index)"
                />
              </div>
            </div>
          </div>

          <div class="flex pb-2 pt-4">
            <FileUpload
              mode="basic"
              name="file"
              customUpload
              auto
              :multiple="true"
              severity="secondary"
              chooseLabel="Carica file"
              class="p-button-outlined"
              @select="(event) => onNoteFileSelect(event)"
            />
          </div>
          <div class="flex justify-end">
            <Button
              label="Aggiungi"
              class="p-button-secondary"
              @click="
                () => {
                  if (newNote) {
                    saveNoteFromDialog(newNote, phaseNoteFiles);
                  } else {
                    toast.add({
                      severity: 'warn',
                      summary: 'Attenzione',
                      detail: 'Nessun nota aggiunta!',
                      life: 3000,
                    });
                  }
                }
              "
            />
          </div>
        </div>
      </div>
      <div
        v-if="saving"
        class="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-md"
      >
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      </div>
    </Dialog>

    <CreateOrUpdateAllocation
      :isEditing="isEditing"
      :newAllocation="newAllocation"
      :showDialog="showDialog"
      :saving="saving"
      @save="updateAllocation"
      @cancel="showDialog = false"
      @reload-allocation="reloadSingleAllocation(currentAllocation.id)"
    />
    <FilePreview ref="preview" />
  </div>
</template>
<script setup>
import { onMounted, ref, watch, computed, reactive } from "vue";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import ToggleSwitch from "primevue/toggleswitch";
import FileUpload from "primevue/fileupload";
import Editor from "primevue/editor";
import { useToast } from "primevue/usetoast";
import { useStore } from "@/store";
import apiClient from "@/router/apiClient";
import apiService from "@/services/apiService";
import Notes from "@/components/Notes.vue";
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
import useVuelidate from "@vuelidate/core";
import { required, helpers } from "@vuelidate/validators";
import Reminder from "@/components/Reminder.vue";
import ProgressSpinner from "primevue/progressspinner";
import Textarea from "primevue/textarea";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useConfirm } from "primevue/useconfirm";
import CreateOrUpdateAllocation from "@/pages/AllocationCreateOrUpdate.vue";
import FilePreview from "@/components/FilePreview.vue";
import { usePermissions } from "@/composables/usePermissions";

const { can } = usePermissions();
const canAllocationsUpdate = computed(() => can("allocations.manage"));
const canAllocationsMop = computed(() => can("allocations.mop"));
const canUsersView = computed(() => can("users.view"));
const canNotesView = computed(() => can("notes.view"));
const canNotesManage = computed(() => can("notes.manage"));
const canRemindersManage = computed(() => can("reminders.manage"));
const canFilesView = computed(() => can("files.view"));
const canFilesManage = computed(() => can("files.manage"));
const canFilesDelete = computed(() => can("files.delete"));

const store = useStore();
const toast = useToast();
const showPhasesDialog = ref(false);
const currentAllocation = ref(null);
const userOptions = ref([]);
const currentParticipant = ref(null);
const startDate = ref("");
const endDate = ref("");
const route = useRoute();
const router = useRouter();
const isLoading = ref(false);
const notFound = ref(false);
const showAddSegmentDialog = ref(false);
const showEditSegmentDialog = ref(false);
const showAddDatesSegmentDialog = ref(false);
const showAddNoteToPhaseDialog = ref(false);
const phases = ref(null);
const selectedPhase = ref(null);
const phaseSegmentTypes = ref([]);
const newSegment = ref({
  name: "",
  type: "",
  required: false,
});
const saving = ref(false);
const showDialog = ref(false);
const isEditing = ref(false);
const preview = ref(null);
const confirm = useConfirm();

const newAllocation = ref({
  name: "",
  description: "",
  start_date: null,
  end_date: null,
  user_id: store.user,
  client_id: "",
  tender_id: "",
  workflow_id: "",
  participants: [],
});

const phaseDateWarnings = computed(() => {
  if (!currentAllocation.value || !selectedPhase.value) return [];

  const warnings = [];

  const allocationStart = currentAllocation.value.start_date
    ? new Date(currentAllocation.value.start_date)
    : null;
  const allocationEnd = currentAllocation.value.end_date
    ? new Date(currentAllocation.value.end_date)
    : null;

  const childStart = startDate.value ? new Date(startDate.value) : null;
  const childEnd = endDate.value ? new Date(endDate.value) : null;

  if (currentSegment.value) {
    const phaseStart = selectedPhase.value.start_date
      ? new Date(selectedPhase.value.start_date)
      : null;
    const phaseEnd = selectedPhase.value.end_date
      ? new Date(selectedPhase.value.end_date)
      : null;

    const startInvalid = childStart && phaseStart && childStart < phaseStart;
    const endInvalid = childEnd && phaseEnd && childEnd > phaseEnd;

    if (startInvalid && endInvalid) {
      warnings.push({
        field: "both",
        message: `Le date inserite non sono comprese nel periodo della fase (${formatDate(
          selectedPhase.value.start_date
        )} → ${formatDate(selectedPhase.value.end_date)}).`,
      });
    } else if (startInvalid) {
      warnings.push({
        field: "start_date",
        message: `La data di inizio del segmento è precedente alla data di inizio della fase (${formatDate(
          selectedPhase.value.start_date
        )}).`,
      });
    } else if (endInvalid) {
      warnings.push({
        field: "end_date",
        message: `La data di fine del segmento è successiva alla data di fine della fase (${formatDate(
          selectedPhase.value.end_date
        )}).`,
      });
    }
  } else {
    const startInvalid =
      childStart && allocationStart && childStart < allocationStart;
    const endInvalid = childEnd && allocationEnd && childEnd > allocationEnd;

    if (startInvalid && endInvalid) {
      warnings.push({
        field: "both",
        message: `Le date inserite non sono comprese nel periodo della pratica (${formatDate(
          currentAllocation.value.start_date
        )} → ${formatDate(currentAllocation.value.end_date)}).`,
      });
    } else if (startInvalid) {
      warnings.push({
        field: "start_date",
        message: `La data di inizio della fase è precedente alla data di inizio della pratica (${formatDate(
          currentAllocation.value.start_date
        )}).`,
      });
    } else if (endInvalid) {
      warnings.push({
        field: "end_date",
        message: `La data di fine della fase è successiva alla data di fine della pratica (${formatDate(
          currentAllocation.value.end_date
        )}).`,
      });
    }
  }

  return warnings;
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
const isAdmin = ref(false);
const confirmDeleteSegmentDialog = ref(false);
const fileIdToDelete = ref(null);

const MOP_TYPES = [
  { key: "rnd", label: "MODELLO R&D", defaultFileName: "mop_rnd.xlsm" },
  { key: "saba", label: "MODELLO SABA 5.0", defaultFileName: "mop_saba.xlsm" },
];
const isMopLoading = ref(false);
const selectedMopType = ref(MOP_TYPES[0].key);
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

  if (isAdmin.value) {
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

  if (isAdmin.value) {
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

  if (canNotesManage.value) {
    options.push({
      label: "Aggiungi una nota",
      icon: "pi pi-pen-to-square",
      command: () => openAddNoteToPhaseDialog(phase),
    });
  }

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

const phaseNotesRef = ref(null);
const newNote = ref(null);
const phaseNoteFiles = ref([]);

const onNoteFileSelect = (event) => {
  const selectedFiles = event.files || [];

  selectedFiles.forEach((file) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.add({
        severity: "warn",
        summary: "File troppo grande",
        detail: `Il file "${file.name}" supera il limite di 1MB`,
        life: 4000,
      });
      return;
    }

    phaseNoteFiles.value.push(file);
  });
};

const openPhases = ref(new Set());

const isPhaseOpen = (phaseId) => openPhases.value.has(phaseId);

const togglePhaseSegments = (phaseId) => {
  if (openPhases.value.has(phaseId)) {
    openPhases.value.delete(phaseId);
  } else {
    openPhases.value.add(phaseId);
  }
};

async function saveNoteFromDialog(content, files) {
  try {
    saving.value = true;
    await phaseNotesRef.value.saveNote(content, files);
    showAddNoteToPhaseDialog.value = false;
  } catch (err) {
    console.error("Error saving note from dialog:", err);
  } finally {
    saving.value = false;
  }
}

watch(
  () => currentParticipant?.value?.user_id,
  (newVal) => {
    if (newVal) {
      currentParticipant.value.external_name = null;
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
  () => currentParticipant?.value?.email,
  (newEmail) => {
    if (newEmail && !currentParticipant.external_name) {
      currentParticipant.value.user_id = null;
    }
  }
);

const loadingAllocation = ref(false);

function setupWorkflowUI(allocation) {
  if (!allocation?.workflow_data) return;

  allocation.workflow_data.sort((a, b) => a.order - b.order);

  allocation.workflow_data.forEach((phase) => {
    phase.segments.forEach((segment) => {
      segment.saved = false;

      if (segment.type === "file" || segment.type === "files") {
        segment.progress = 0;
        segment.fileTooBig = false;
      }

      if (
        (segment.type !== "files" && segment.value) ||
        (segment.type === "files" && segment.value?.length)
      ) {
        segment.saved = true;
      }
    });
  });
  phases.value = allocation.workflow_data;
}

onMounted(async () => {
  if (route.params.id) {
    isLoading.value = true;
    try {
      currentAllocation.value = await apiService.getWithAuth(
        `allocations/${route.params.id}`
      );
      if (currentAllocation.value.workflow_data) {
        setupWorkflowUI(currentAllocation.value);
      }
      phaseSegmentTypes.value = store.defaults.phase_segment_types;
      if (canUsersView.value) {
        await fetchUsers();
      }
    } catch (error) {
      notFound.value = true;
      console.error("Error showing allocation details:", error.message);
    } finally {
      isLoading.value = false;
    }
  }
});

const downloadFile = async (file) => {
  try {
    const response = await apiClient.get(`${store.api}/files/${file?.id}`, {
      headers: { Authorization: `Bearer ${store.token}` },
      responseType: "blob",
    });

    let fileName = file?.name || "downloaded-file";

    const mimeType = response.data.type || "application/octet-stream";
    const extensionMap = {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "xlsx",
      "application/vnd.ms-excel": "xls",
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "image/png": "png",
      "image/jpeg": "jpg",
      "text/plain": "txt",
    };

    if (!/\.[a-zA-Z0-9]+$/.test(fileName)) {
      const ext = extensionMap[mimeType] || mimeType.split("/")[1] || "bin";
      fileName += `.${ext}`;
    }

    const blob = new Blob([response.data], {
      type: "application/octet-stream",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading file:", error.message);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: `Download del file fallito.`,
      life: 3000,
    });
  }
};

const isPreviewable = (file) => {
  if (!file || !file.type) return false;
  const previewableTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
  ];
  return previewableTypes.includes(file.type);
};

const isImage = (file) => {
  if (!file || !file.type) return false;
  return file.type.startsWith("image/");
};

const openPreview = async (file) => {
  try {
    const response = await apiClient.get(`${store.api}/files/${file?.id}/preview`, {
      headers: { Authorization: `Bearer ${store.token}` },
      responseType: "blob",
    });

    const blob = new Blob([response.data], {
      type: file.type || "application/octet-stream",
    });
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank");

    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error("Error opening preview:", error.message);
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: `Impossibile aprire il file.`,
      life: 3000,
    });
  }
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
    if (validFiles.length) {
      validFiles.forEach((file, index) => {
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
      toast.add({
        severity: "success",
        summary: "Successo",
        detail: "File caricato con successo!",
        life: 3000,
      });
      await reloadSingleAllocation(currentAllocation.value.id);
    }
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

  if (event.dataTransfer && event.dataTransfer.files.length) {
    files = event.dataTransfer.files;
  } else if (event.files && event.files.length) {
    files = event.files;
  }

  if (!files.length) return;

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

  if (validFiles.length) {
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
          detail: `Eliminazione del file fallita.`,
          life: 3000,
        });
      }
    }
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

      toast.add({
        severity: "success",
        summary: "Successo",
        detail: `Caricamento riuscito per ${validFiles.length} file.`,
        life: 3000,
      });
      await reloadSingleAllocation(currentAllocation.value.id);
    }
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

const reloadSingleAllocation = async (allocationId) => {
  await fetchSingleAllocation(allocationId);
};

const fetchSingleAllocation = async (allocationId) => {
  try {
    currentAllocation.value = await apiService.getWithAuth(
      `allocations/${allocationId}`
    );
    if (currentAllocation.value.workflow_data) {
      setupWorkflowUI(currentAllocation.value);
    }
  } catch (error) {
    console.error("Error showing allocation details:", error.message);
  } finally {
    loadingAllocation.value = false;
  }
};

watch(
  () => route.params.id,
  () => {
    loadingAllocation.value = true;
    fetchSingleAllocation(route.params.id);
  }
);
const saveNewSegment = async () => {
  try {
    const isValid = await vNewSegment.value.$validate();
    if (!isValid) return;

    saving.value = true;
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
    }
    await reloadSingleAllocation(currentAllocation.value.id);
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
  } finally {
    saving.value = false;
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
      await reloadSingleAllocation(currentAllocation.value.id);
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

    saving.value = true;
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
      await reloadSingleAllocation(currentAllocation.value.id);
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
  } finally {
    saving.value = false;
  }
};

const addDatesToSegment = async () => {
  if (!startDate.value && !endDate.value) {
    toast.add({
      severity: "warn",
      summary: "Attenzione",
      detail: "Inserisci almeno una data.",
      life: 3000,
    });
    return;
  }

  if (
    startDate.value &&
    endDate.value &&
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

  try {
    saving.value = true;

    const payload = {
      start_date: startDate.value ? formatDateIso(startDate.value) : null,
      end_date: endDate.value ? formatDateIso(endDate.value) : null,
    };

    const isPhaseUpdate = !currentSegment.value;

    if (isPhaseUpdate) {
      const response = await apiClient.put(
        `${store.api}/allocations/${currentAllocation.value.id}/phases/${selectedPhase.value.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${store.token}` },
        }
      );

      if (response.data) {
        toast.add({
          severity: "success",
          summary: "Successo",
          detail: "Date della fase aggiornate con successo!",
          life: 3000,
        });
      }
    } else {
      const response = await apiClient.put(
        `${store.api}/allocations/${currentAllocation.value.id}/phases/${selectedPhase.value.id}/segments/${currentSegment.value.id}/dates`,
        payload,
        {
          headers: { Authorization: `Bearer ${store.token}` },
        }
      );

      if (response.data) {
        toast.add({
          severity: "success",
          summary: "Successo",
          detail: "Date del segmento aggiornate con successo!",
          life: 3000,
        });
      }
    }

    await reloadSingleAllocation(currentAllocation.value.id);

    showAddDatesSegmentDialog.value = false;
  } catch (error) {
    console.error(
      "Error updating dates:",
      error.response?.data?.message || error.message
    );
    toast.add({
      severity: "error",
      summary: "Errore",
      detail: error.response?.data?.message || "Aggiornamento fallito",
      life: 3000,
    });
  } finally {
    saving.value = false;
  }
};
const deleteSegment = async () => {
  try {
    saving.value = true;
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
      await reloadSingleAllocation(currentAllocation.value.id);
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
  } finally {
    saving.value = false;
  }
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

function getFileNameFromHeaders(headers, fallback) {
  const cd =
    headers?.["content-disposition"] || headers?.["Content-Disposition"];
  if (!cd) return fallback;

  const match = cd.match(
    /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i
  );
  const name = match?.[1] || match?.[2] || match?.[3];
  if (!name) return fallback;

  try {
    return decodeURIComponent(name.trim());
  } catch {
    return name.trim();
  }
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

function sanitizeFilePart(input) {
  if (!input) return "";
  return (
    String(input)
      .trim()
      // Windows-forbidden + generally annoying filename chars
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, " ")
      .replace(/\.+$/g, "") // no trailing dots
      .slice(0, 80)
  ); // keep parts reasonable
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
  currentSegment.value = segment ? { ...segment } : null;

  if (segment) {
    startDate.value = segment.start_date ? new Date(segment.start_date) : "";
    endDate.value = segment.end_date ? new Date(segment.end_date) : "";
  } else {
    startDate.value = phase.start_date ? new Date(phase.start_date) : "";
    endDate.value = phase.end_date ? new Date(phase.end_date) : "";
  }

  showAddDatesSegmentDialog.value = true;
}

function openAddNoteToPhaseDialog(phase) {
  selectedPhase.value = phase;
  newNote.value = null;
  phaseNoteFiles.value = [];
  showAddNoteToPhaseDialog.value = true;
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

function checkRole() {
  const storedUserKey = localStorage.getItem("user");
  const user = userOptions.value.find((u) => u.value === storedUserKey);
  const roles = user?.roles || [];
  isAdmin.value = roles.some((role) => role.name === "admin");
}

const deleteFile = async (fileId) => {
  if (!canFilesDelete.value) return;

  try {
    await apiClient.delete(`${store.api}/files/${fileId}`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });

    await reloadSingleAllocation(currentAllocation.value.id);
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
      await reloadSingleAllocation(currentAllocation.value.id);
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

const dragOver = ref(false);

function onDragOver(event) {
  event.preventDefault();
  dragOver.value = true;
}

function onDragLeave(event) {
  event.preventDefault();
  dragOver.value = false;
}

function onDrop(event) {
  event.preventDefault();
  dragOver.value = false;

  const files = event.dataTransfer.files;
  if (!files.length) return;

  onFileSelectAllocation({ files: Array.from(files) });
}

function isEmptyValue(value) {
  if (!value) return true;
  const stripped = value
    .replace(/<p><\/p>/g, "")
    .replace(/<br\s*\/?>/g, "")
    .trim();
  return stripped.length === 0;
}

const getUserLabel = (userId) => {
  const user = userOptions.value.find((u) => u.value === userId);
  return user ? user.label : "";
};

const editAllocation = async () => {
  newAllocation.value = {
    id: currentAllocation.value.id,
    client_id: currentAllocation.value.client?.id || null,
    tender_id: currentAllocation.value.tender?.id || null,
    workflow_id: currentAllocation.value.workflow?.id || null,
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

const updateAllocation = async () => {
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

    showDialog.value = false;
    await reloadSingleAllocation(newAllocation.value.id);
  } catch (error) {
    console.error(
      `Error during ${isEditing.value ? "update" : "creation"}:`,
      error.message
    );
  } finally {
    saving.value = false;
  }
};

const removeNoteFile = (index) => {
  confirm.require({
    message: "Sei sicuro di voler eliminare questo allegato?",
    header: "Conferma eliminazione",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    rejectClass: "p-button-secondary",
    acceptLabel: "Sì",
    rejectLabel: "Annulla",
    accept: () => {
      phaseNoteFiles.value.splice(index, 1);
    },
  });
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

.break-file-name {
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  max-width: 100%;
  line-height: 1.4;
}
</style>

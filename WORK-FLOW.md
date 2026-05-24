pages/workflow-designer/
└── index.js                        ← page entry, Ant Layout 3 cột

routes/PrivateRoutes/
└── WorkflowDesignerConfig.js       ← thêm vào index.js hiện có

containers/WorkflowDesigner/
├── index.js                        ← re-export
├── StepPanel.js                    ← Sider trái: palette + danh sách steps
├── FlowCanvas.js                   ← vùng canvas + toolbar
├── StepNode.js                     ← custom ReactFlow node
├── EdgeLabel.js                    ← custom ReactFlow edge
├── DetailPanel.js                  ← Sider phải: switch StepForm/TransitionForm
├── StepForm.js                     ← Antd Form cấu hình step
├── TransitionForm.js               ← Antd Form + GuardList + ActionList
└── styles.js                       ← styled-components cho toàn feature

store/                              ← thư mục mới (Zustand, tách khỏi DataContext)
├── workflowStore.js                ← nodes, edges, selectedId, processInfo
└── workflowConstants.js            ← STEP_TYPES, GUARD_TYPES, ACTION_TYPES

hooks/ (thêm vào)
├── useWorkflowStore.js             ← accessor vào workflowStore
├── useFlowHandlers.js              ← onConnect, onDrop, onNodesChange
├── useWorkflowExport.js            ← flowToJson / jsonToFlow
└── useWorkflowHistory.js           ← undo/redo stack

utils/ (thêm vào)
├── workflowSerializer.js           ← convert ReactFlow ↔ Flast NoCode API format
└── workflowValidators.js           ← validateFlow, checkOrphanNodes

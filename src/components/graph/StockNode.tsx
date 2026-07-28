import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { cn } from '#/shared/utils/cn'
import type { StockFlowNode } from '#/types/graph'

export default function StockNode({ data }: NodeProps<StockFlowNode>) {
  return (
    <div
      className={cn(
        'nd',
        data.abstract && 'abs',
        data.tier,
        data.state,
        data.isMain && 'main',
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        className="nd-handle"
      />
      <div
        key={data.pulseToken ?? 0}
        className={cn('ring', data.pulseToken && 'go')}
      />
      {data.badge && (
        <span className={cn('nbadge', data.badge === 'UP' ? 'up' : 'down')}>
          {data.badge === 'UP' ? '▲' : '▼'}
        </span>
      )}
      <div className="nd-name">{data.label}</div>
      {data.ticker && <div className="nd-tk">{data.ticker}</div>}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        className="nd-handle"
      />
    </div>
  )
}

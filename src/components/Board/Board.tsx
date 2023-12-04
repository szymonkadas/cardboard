import { PropsWithChildren } from 'react'

import styles from './Board.module.css'

export const Board = (props: PropsWithChildren<{}>) => (
  <div data-cy={'board'} data-testid={`board`} className={styles.board}>
    {props.children}
  </div>
)

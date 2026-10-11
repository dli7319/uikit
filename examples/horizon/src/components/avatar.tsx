import { Container } from '@react-three/uikit'
import { Avatar } from '@react-three/uikit-horizon'

export function AvatarDemo() {
  return (
    <Container alignItems="center">
      <Avatar
        src="/uikit/examples/horizon/avatar.png"
        size="lg"
        attributionActive
      />
    </Container>
  )
}
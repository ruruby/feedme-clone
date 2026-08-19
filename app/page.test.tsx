import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Home from "@/app/page";

test("홈 화면은 URL 입력창과 변환 버튼을 보여준다", () => {
  render(<Home />);

  expect(
    screen.getByPlaceholderText(/https:\/\/example.com/i)
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "변환" })).toBeInTheDocument();
});

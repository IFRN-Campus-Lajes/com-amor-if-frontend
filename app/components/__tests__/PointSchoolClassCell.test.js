import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PointSchoolClassCell from "../PointSchoolClassCell";

describe("PointSchoolClassCell", () => {
  it("mostra a turma diretamente em um lançamento individual", () => {
    render(
      <PointSchoolClassCell
        point={{ collective: false, turma: { nome: "1º A" } }}
      />
    );

    expect(screen.getByText("1º A")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("resume o lançamento coletivo por turno e anima a sanfona de turmas", async () => {
    const user = userEvent.setup();
    render(
      <PointSchoolClassCell
        point={{
          collective: true,
          turno: 1,
          schoolClasses: [{ nome: "2º A" }, { nome: "2º B" }],
        }}
      />
    );

    expect(screen.getByText("Coletiva • Vespertino")).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: /exibir 2 turmas/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("2º A")).toBeInTheDocument();
    expect(screen.getByText("2º B")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /turmas de coletiva/i })).toHaveClass(
      "grid-rows-[1fr]"
    );
  });
});
